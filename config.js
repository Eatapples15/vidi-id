// Configurazione del sito vetrina: si cambia solo qui.
//   appUrl     indirizzo dell'app, con lo slash finale. I link con data-app="percorso"
//              puntano ad appUrl + percorso.
//   brandName  nome del prodotto: sostituisce il testo degli elementi con data-brand
//              e il nome nel titolo della pagina.
window.SITE_CONFIG = {
  appUrl: 'https://www.formazionesicurezza.org/protezionecivile/passaporto_formazione/',
  brandName: 'VIDI',
}

// Nome scritto nell'HTML come riserva per chi non ha JavaScript.
const FALLBACK_BRAND = 'VIDI'

document.addEventListener('DOMContentLoaded', () => {
  const { appUrl, brandName } = window.SITE_CONFIG
  for (const link of document.querySelectorAll('[data-app]')) {
    link.href = appUrl + link.dataset.app
  }
  for (const el of document.querySelectorAll('[data-brand]')) {
    el.textContent = brandName
  }
  document.title = document.title.replace(FALLBACK_BRAND, brandName)

  const toggle = document.querySelector('.nav-toggle')
  const nav = document.querySelector('.site-nav')
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open')
    toggle.setAttribute('aria-expanded', String(open))
  })
})
