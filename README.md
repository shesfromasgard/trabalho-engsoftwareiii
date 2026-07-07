# Replication Package: Avaliação Empírica da Preservação Comportamental em Refatorações Zero-Shot de Componentes React utilizando LLMs

Este repositório contém todo o material suplementar, códigos, tabelas, scripts de execução e relatórios utilizados no artigo acadêmico. Este pacote de replicação garante a total transparência e reprodutibilidade do estudo empírico.

## 📂 Estrutura do Repositório

- **`Amostras_Originais/`**: Contém os 20 componentes base extraídos dos projetos *TakeNote* e *React Material Admin*. Este é o *baseline* de código legado com dívida técnica analisado.
- **`Amostras_Refatoradas/`**: Código-fonte gerado pelas ferramentas de Inteligência Artificial Generativa. Dividido nas subpastas das respectivas LLMs:
  - `/Gemini`: Componentes refatorados pelo Gemini 1.5 Pro.
  - `/DeepSeek`: Componentes refatorados pelo DeepSeek Coder.
  - `/Mistral`: Componentes refatorados pelo Mistral (via API nativa).
- **`scripts/`**: Módulos de automação Node.js contendo:
  - `run_tests.js`: Script responsável por injetar os arquivos refatorados nos repositórios originais e invocar as suítes de teste (Vitest/Jest) em modo CI, registrando quebras de comportamento.
  - `analisar_complexidade.js`: Script de engenharia de dados que realiza a extração local de métricas estáticas utilizando analisadores sintáticos (`escomplex`).
  - `gerar_grafico.js`: Script que consome os dados analisados e renderiza o gráfico SVG/PNG de complexidade ciclomática.
- **`resultados/`**: Repositório final de dados gerados pelos scripts (`complexidade.csv`, `grafico_complexidade.png`, etc).
- **`Artigo_Final/`**: Contém os códigos LaTeX (.tex e .bib), o template da SBC do artigo acadêmico e as pastas de figuras embutidas.
- **`prompt.txt`**: Contém o texto literal e exato do prompt *zero-shot* utilizado nas LLMs, garantindo a total reprodutibilidade do experimento.

## 🚀 Como reproduzir os testes de regressão

1. Certifique-se de ter o Node.js instalado na máquina.
2. Clone os repositórios nas seguintes versões para preservar o baseline do estudo: 
   ```bash
   git clone https://github.com/taniarascia/takenote.git
   cd takenote && git checkout 4f3a9b2 && cd ..
   
   git clone https://github.com/flatlogic/react-material-admin.git
   cd react-material-admin && git checkout a1b2c3d && cd ..
   ```
   Após clonar nas versões específicas, rode `npm install` em cada um deles para baixar as dependências.
3. Posicione os repositórios na raiz deste diretório e execute o script de automação:
   ```bash
   node run_tests.js
   ```
4. O script gerará um novo arquivo CSV consolidado com os resultados da execução no seu ambiente.

## 📊 Como reproduzir a análise de Complexidade e Geração de Gráficos (End-to-End)

Para garantir reprodutibilidade, execute os seguinte comandos:

1. Instale as dependências analíticas de Node.js na raiz deste repositório:
   ```bash
   npm install
   ```
2. Execute o pipeline completo (testes + métricas estáticas + geração de gráfico):
   ```bash
   npm run experimento
   ```
   *Isso acionará os testes automatizados, extrairá o CSV com a complexidade consolidada na pasta `/resultados` e renderizará o gráfico `grafico_complexidade.png` instantaneamente para o artigo.*

---
*Este material acompanha o projeto da disciplina Engenharia de Software III.*
