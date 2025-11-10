# Deploy na InfinityFree (sem mudar seu HTML/CSS/JS)

1) Crie uma conta na InfinityFree e um **MySQL Database** no painel.
2) No **phpMyAdmin**, rode o arquivo `sql/schema.sql` para criar as tabelas.
3) Edite `config/db.php` e coloque `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` do seu banco.
4) Faça upload de todos os arquivos desta pasta para `htdocs/` (via Gerenciador de Arquivos ou FTP).
5) Acesse `https://SEU_DOMINIO/` — seus arquivos `index.html`, `css/`, `js/`, `assets/` seguem iguais.
6) As chamadas `fetch('/api/...')` funcionarão no mesmo domínio:
   - POST `/api/auth/register`
   - POST `/api/auth/login`
   - GET  `/api/products`
   - DELETE `/api/products/:id`
   - POST `/api/sales/finish`
   - GET  `/api/sales/report?from=YYYY-MM-DD&to=YYYY-MM-DD`

### Observações
- A impressão da **notinha** e os **relatórios** permanecem do lado do **front-end**: a API retorna JSON igual ao backend antigo.
- Faça **backup** regular do banco via phpMyAdmin (Export).
- Caso seu JS aponte para `http://localhost:3000`, altere **apenas a base da URL** para `''` (mesmo domínio). Se já usa caminhos relativos (`/api/...`), não precisa mudar nada.
