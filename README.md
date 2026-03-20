# OfertaDex — As Melhores Promos

Página estática de vitrine de ofertas da Amazon com links de afiliado.

## Funcionalidades

- Exibição de produtos em grade responsiva
- Filtro por categoria (pills clicáveis)
- Busca por título ou categoria com debounce
- Scroll infinito (50 produtos por página via IntersectionObserver)
- Links para Instagram e Facebook no topo

## Estrutura

```
produtos-page/
├── index.html       # Estrutura da página (topbar, header, filtros, grid, footer)
├── style.css        # Estilos da página
├── script.js        # Lógica: carregamento, filtro, busca, scroll infinito
└── produtos.json    # Lista de produtos (fonte de dados)
```

## Formato do produtos.json

Cada produto deve seguir este formato:

```json
{
  "asin": "B07HDSL78H",
  "titulo": "Nome do produto",
  "categoria": "Categoria",
  "preco_cent": 13910,
  "imagem_url": "https://...",
  "affiliate_url": "https://amzn.to/...",
  "published_at": "2026-03-20T17:30:00"
}
```

> `preco_cent` é o preço em centavos (ex: `13910` = R$ 139,10).

## Como rodar localmente

Por ser uma página estática que faz `fetch('produtos.json')`, é necessário servir via HTTP (não abre direto do sistema de arquivos):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Acesse em `http://localhost:8080`.

## Deploy

O site é publicado via **GitHub Pages** diretamente da branch `main`.

## Links

- Instagram: [@ofertadex](https://www.instagram.com/ofertadex)
- Facebook: [ofertadex1](https://www.facebook.com/ofertadex1)
