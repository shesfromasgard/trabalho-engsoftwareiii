import React from 'react'
import { isMobile } from 'react-device-detect'

import lightScreen from '@resources/assets/screenshot-light.png'
import darkScreen from '@resources/assets/screenshot-dark.png'
import squareLogo from '@resources/assets/logo-square-white.svg'
import logo from '@resources/assets/logo-square-color.svg'
import githubLogo from '@resources/assets/github-logo.png'

const clientId = process.env.CLIENT_ID
const isDemo = process.env.DEMO

const GitHubLoginButton: React.FC<{ text: string }> = ({ text }) => (
  <a
    className="button github-button"
    href={`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`}
  >
    <img src={githubLogo} />
    {text}
  </a>
)

const MobileUnsupported: React.FC = () => (
  <p className="p-mobile">
    TakeNote is not currently supported for tablet and mobile devices.
  </p>
)

const DemoNotice: React.FC = () => (
  <div className="new-signup">
    <div>
      <p>
        TakeNote is only available as a demo. Your notes will be saved to local storage
        and <b>not</b> persisted in any database or cloud.
      </p>
      <a className="button" href="/app">
        View Demo
      </a>
    </div>
  </div>
)

const SignUpPrompt: React.FC = () => (
  <div className="new-signup">
    <div>
      <p>
        TakeNote does not have a database or users. It simply links with your GitHub
        account for authentication, and stores the data in a private{' '}
        <code>takenotes-data</code> repo.
      </p>
      <div className="cta">
        <GitHubLoginButton text="Sign Up with GitHub" />
      </div>
    </div>
  </div>
)

const LeadAction: React.FC = () => {
  if (isMobile) {
    return <MobileUnsupported />
  }
  if (isDemo) {
    return <DemoNotice />
  }
  return <SignUpPrompt />
}

const FEATURES: React.ReactNode[] = [
  <><strong>Plain text notes</strong> - take notes in an IDE-like environment that makes no assumptions</>,
  <><strong>Markdown preview</strong> - view rendered HTML</>,
  <><strong>Linked notes</strong> - use <code>{`{{uuid}}`}</code> syntax to link to notes within other notes</>,
  <><strong>Syntax highlighting</strong> - light and dark mode available (based on the beautiful{' '}
    <a href="https://taniarascia.github.io/new-moon/">New Moon theme</a>)</>,
  <><strong>Keyboard shortcuts</strong> - use the keyboard for all common tasks - creating notes and categories, toggling settings, and other options</>,
  <><strong>Drag and drop</strong> - drag a note or multiple notes to categories, favorites, or trash</>,
  <><strong>Multi-cursor editing</strong> - supports multiple cursors and other{' '}
    <a href="https://codemirror.net/">Codemirror</a> options</>,
  <><strong>Search notes</strong> - easily search all notes, or notes within a category</>,
  <><strong>Prettify notes</strong> - use Prettier on the fly for your Markdown</>,
  <><strong>No WYSIWYG</strong> - made for developers, by developers</>,
  <><strong>No database</strong> - notes are only stored in the browser&#39;s local storage and are available for download and export to you alone</>,
  <><strong>No tracking or analytics</strong> - &#39;nuff said</>,
  <><strong>GitHub integration</strong> - self-hosted option is available for auto-syncing to a GitHub repository (not available in the demo)</>,
]

const Features: React.FC = () => (
  <div className="features">
    <h2 className="text-center">Features</h2>
    <ul>
      {FEATURES.map((feature, index) => (
        <li key={index}>{feature}</li>
      ))}
    </ul>
  </div>
)

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container-small">
      <img src={squareLogo} alt="TakeNote App" className="logo" />
      <p>
        <strong>TakeNote</strong>
      </p>
      <nav>
        <a
          href="https://github.com/taniarascia/takenote"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
        </a>
        <a
          href="https://github.com/taniarascia/takenote/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Issues
        </a>
        <a
          href="https://github.com/taniarascia/takenote/graphs/contributors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contributors
        </a>
      </nav>
    </div>
  </footer>
)

export const LandingPage: React.FC = () => {
  return (
    <section className="landing-page">
      <section className="content">
        <div className="container-small">
          <div className="lead">
            <img src={logo} height="200" width="200" alt="TakeNote" />
            <h1>
              The Note Taking App
              <br /> for Developers
            </h1>
            <p className="subtitle">A web-based notes app for developers.</p>
            <LeadAction />
          </div>
        </div>
        <div className="container">
          <img src={lightScreen} alt="TakeNote App" className="screenshot" />
        </div>
      </section>

      <section className="content">
        <div className="container-small">
          <Features />
        </div>
        <div className="container">
          <img src={darkScreen} alt="TakeNote App" className="screenshot" />
        </div>
      </section>

      <Footer />
    </section>
  )
}