# Sito personale di Elisabetta Chisso

Sito statico in Jekyll, pensato per GitHub Pages: lo compila GitHub a ogni push, senza build da configurare.

## Pubblicazione

1. Crea un repository su GitHub (per esempio `sito`) e carica tutti i file di questa cartella.
2. In **Settings › Pages**, alla voce *Source*, scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`.
3. Dominio personalizzato: in **Settings › Pages › Custom domain** inserisci il dominio (es. `www.tuodominio.it`). GitHub crea il file `CNAME` nel repository.
4. Dal pannello DNS del dominio:
   - per `www.tuodominio.it`: record **CNAME** verso `<tuo-utente>.github.io`;
   - per il dominio nudo `tuodominio.it`: record **A** verso `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (e AAAA verso `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`).
5. Quando il certificato è pronto, attiva **Enforce HTTPS**.
6. In `_config.yml` imposta `url` con il tuo dominio e `github` con il tuo profilo.

## Da completare

- `_config.yml`: `url` e link GitHub.
- `index.html`: tesi magistrale e stack della web app (cerca le parentesi quadre `[ ]`).
- `assets/cv/`: esporta il CV in PDF e salvalo come `CV_Elisabetta_Chisso_IT.pdf` e `CV_Elisabetta_Chisso_EN.pdf`. Prima di pubblicarlo valuta se togliere telefono e data di nascita, perché il sito è pubblico.
- `assets/img/elisabetta.jpg`: sostituiscila con una foto a risoluzione più alta quando ce l'hai.

## Scrivere un articolo

Crea un file in `_posts/` chiamato `AAAA-MM-GG-titolo.md`:

```markdown
---
layout: post
title: "Titolo"
lang: it          # it oppure en
ref: titolo-breve # uguale nella versione tradotta, per collegarle
summary: "Una riga che compare nell'elenco."
---

Testo in Markdown.
```

Gli articoli compaiono nella lingua scelta con il selettore IT/EN. Se esiste la traduzione con lo stesso `ref`, il selettore porta direttamente all'altra versione.

## Anteprima in locale (facoltativa)

Con Ruby installato: `gem install bundler jekyll` e poi `jekyll serve` nella cartella; il sito è su `http://localhost:4000`.
"# personal-website" 
