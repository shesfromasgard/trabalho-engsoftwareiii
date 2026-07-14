# Pacote de replicação — reescritas zero-shot de componentes React

Este diretório acompanha o artigo **“Aprovação de Suítes de Teste após Reescritas Zero-Shot de Componentes React por Interfaces de LLM: um Estudo Exploratório”**. Ele reúne as 20 unidades analisadas, as 60 saídas preservadas, os prompts documentados, os scripts corrigidos e os resultados da reexecução.

O pacote permite auditar os dados e reproduzir os testes e as métricas no ambiente indicado. Ele não permite regenerar exatamente as saídas das LLMs: os artefatos originais não preservaram versão, data, parâmetros de amostragem ou identificador de execução dos modelos. Por esse motivo, os grupos são identificados somente pelos rótulos verificáveis **Gemini**, **DeepSeek** e **Mistral**. Eles descrevem três conjuntos arquivados de saídas, não tratamentos completamente replicáveis nem famílias abstratas de modelos.

## Conteúdo

- `Amostras_Originais/`: 20 arquivos originais — 15 do TakeNote e 5 do React Material Admin.
- `Amostras_Refatoradas/{Gemini,DeepSeek,Mistral}/`: 60 arquivos produzidos no experimento original.
- `prompt_original.txt`: transcrição do prompt relatado no manuscrito original.
- `prompt_recomendado.txt`: versão mais restritiva proposta após a análise das ameaças à validade; **não foi usada para gerar os 60 arquivos existentes**.
- `scripts/run_tests.js`: substitui uma unidade por vez no repositório correspondente, executa a suíte completa e restaura o arquivo original.
- `scripts/analisar_complexidade.js`: calcula métricas estáticas com a API de compilador do TypeScript.
- `scripts/analisar_resultados.js`: calcula resultados por repositório, deltas pareados, dispersão e a análise restrita a saídas aprovadas.
- `scripts/gerar_grafico.js`: gera o gráfico de variação percentual a partir do resumo de métricas.
- `scripts/gerar_manifesto.js`: calcula SHA-256 dos artefatos e resultados para verificação de integridade.
- `resultados/`: CSVs, metadados, gráfico e logs da reexecução.

Os arquivos antigos `Resultados_Testes.csv`, `complexidade.csv` e `grafico_complexidade.png` foram isolados em `resultados/legado/` e preservados apenas para rastreabilidade. Eles não sustentam a versão corrigida. Os resultados atuais são os arquivos cujo nome contém `reexecucao`, `metricas_` ou `reducao_percentual`.

## Proveniência dos projetos

As unidades foram mapeadas para os seguintes estados dos projetos:

- TakeNote: `taniarascia/takenote`, commit completo `e0eddbb9a21ae4cf4c4c7c183f29cfd666e08331`.
- React Material Admin: `flatlogic/react-material-admin`, commit completo `dd136027c2253253cfb5b8a4cb698696fb63f8cd`.

Clonagem e instalação recomendadas:

```bash
git clone https://github.com/taniarascia/takenote.git
git -C takenote checkout e0eddbb9a21ae4cf4c4c7c183f29cfd666e08331
npm --prefix takenote ci

git clone https://github.com/flatlogic/react-material-admin.git
git -C react-material-admin checkout dd136027c2253253cfb5b8a4cb698696fb63f8cd
npm --prefix react-material-admin ci
```

Ambiente usado na correção: Windows 10.0.26300 x64, Node.js 22.20.0, npm 10.9.3 e Git. O `package-lock.json` deste pacote fixa as dependências analíticas; as dependências dos projetos são fixadas pelos respectivos arquivos de lock.

## Reexecução dos testes

Defina os caminhos absolutos dos dois clones. Em PowerShell:

```powershell
$env:TAKENOTE_DIR = 'C:\caminho\takenote'
$env:REACT_ADMIN_DIR = 'C:\caminho\react-material-admin'
npm ci
npm run testes
```

Em shells POSIX:

```bash
TAKENOTE_DIR=/caminho/takenote \
REACT_ADMIN_DIR=/caminho/react-material-admin \
npm run testes
```

O script primeiro valida o commit e executa o baseline de cada projeto. Depois, para cada combinação de arquivo e provedor, copia a saída correspondente para o caminho original, executa toda a suíte do projeto, registra o código de saída e restaura o arquivo em um bloco `finally`. Os principais produtos são:

- `resultados/Resultados_Testes_reexecucao.csv`;
- `resultados/metadados_reexecucao.json`;
- `resultados/manifesto_sha256.csv`;
- `resultados/logs/testes/*.log`.

Uma execução é classificada como aprovada somente quando o comando de teste termina com código de saída zero. Isso constitui evidência de ausência de regressão **detectável pelas suítes existentes**, não prova de equivalência comportamental.

## Métricas estáticas

Instale as dependências deste pacote e execute:

```bash
npm ci
npm run analise
```

As definições completas e os limiares estão em `resultados/metodologia_metricas.json`. Em síntese:

- LOC: linhas com tokens sintáticos;
- complexidade ciclomática: 1 por função mais pontos de decisão;
- complexidade cognitiva: pontos por decisões e aninhamento;
- duplicação: proporção aproximada de linhas em sequências normalizadas de 20 tokens repetidas no mesmo arquivo;
- odores: função longa (>50 LOC), CC alta (>10), complexidade cognitiva alta (>15), aninhamento profundo (>3), arquivo grande (>300 LOC) e duplicação (>=10%).

O analisador produz `metricas_por_arquivo.csv`, `metricas_resumo.csv` e `metodologia_metricas.json`. A etapa de sensibilidade acrescenta `metricas_por_repositorio.csv`, `metricas_deltas_por_arquivo.csv`, `metricas_distribuicao_cc.csv` e `metricas_sensibilidade.csv`. No último arquivo, saídas com `FAIL` e seus originais correspondentes são excluídos em conjunto, preservando o pareamento. O gráfico usa a redução percentual de cada grupo em relação às mesmas 20 unidades originais; valores negativos representam aumento da métrica.

As seis regras de odores são decisões operacionais exploratórias. Suas categorias devem ser interpretadas separadamente; a soma de ocorrências heterogêneas não constitui escala validada nem porcentagem direta de qualidade.

## Execução completa

Depois de configurar os dois caminhos de projeto:

```bash
npm ci
npm run experimento
```

Os resultados podem variar em tempo de execução e mensagens de ferramentas, mas os arquivos de entrada, commits, comandos e critérios de classificação ficam registrados nos metadados. Alterações de plataforma, versão do Node ou dependências externas devem ser relatadas em qualquer replicação.

## Limitações de reprodutibilidade

- As versões e configurações das três LLMs não foram preservadas no experimento original.
- Os testes medem apenas comportamentos cobertos pelas suítes dos projetos.
- As métricas estáticas implementadas são aproximações operacionais documentadas, não saídas de SonarQube nem medidas universais de qualidade.
- O prompt recomendado é material de melhoria metodológica e exigiria uma nova geração experimental para produzir resultados comparáveis.

Licença: código do pacote sob MIT; os projetos de origem e suas dependências permanecem sujeitos às respectivas licenças.
