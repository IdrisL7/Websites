# Idris Lamina — Portfolio Website

Personal portfolio website for Idris Lamina, IT Consultant and Implementation Lead based in London.

**Live site:** [idrislamina.com](https://idrislamina.com)

---

## Pages

| Page | URL | Description |
|---|---|---|
| Home | `/` | Landing page with name, tagline, and navigation |
| About | `/about` | Background, experience, and skills |
| Portfolio | `/works` | Selected enterprise SaaS implementation projects |
| Project Portfolio | `/portfolio` | Personal project showcase with screenshots |
| Pitch | `/pitch` | Engagement models and day/retainer rates |
| Contact | `/contact` | Enquiry form and direct contact details |

---

## Tech Stack

- **HTML5** — semantic, accessible markup
- **CSS3** — custom stylesheet, no frameworks
- **Google Fonts** — DM Serif Display (headings) + Inter (body)
- **Formspree** — contact form submissions delivered to email
- **Apache `.htaccess`** — clean URLs (no `.html`) and HTTPS redirect

---

## Project Structure

```
portfolio/
├── index.html        # Home page
├── about.html        # About page
├── works.html        # Portfolio page
├── portfolio.html    # Project portfolio with screenshots
├── pitch.html        # Pitch / engagement models page
├── contact.html      # Contact page with enquiry form
├── style.css         # All styles
├── images/           # Portfolio project screenshots
├── og-image.png      # Open Graph social preview image (1200×630)
├── sitemap.xml       # XML sitemap
├── robots.txt        # Robots directives
├── .htaccess         # Clean URLs + HTTPS redirect (Apache)
└── .gitignore
```

---

## Features

- Responsive, mobile-first design
- Dark mode support via `prefers-color-scheme`
- Clean URLs via `.htaccess` (e.g. `/about` not `/about.html`)
- HTTPS enforced via `.htaccess` redirect
- Open Graph and Twitter Card meta tags for social sharing
- SVG favicon embedded inline — no external file needed
- Contact form powered by Formspree

---

## Deployment

The site is hosted on **IONOS**. To deploy updates:

1. Upload changed files to the `public/` folder via the IONOS File Manager or FTP
2. The `.htaccess` file must be present in `public/` for clean URLs and HTTPS to work

---

## Local Development

No build step required. Open any HTML file directly in a browser, or use a local server:

```bash
npx serve .
```
