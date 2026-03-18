# Primeiro acesso: Planos e SUPERADMIN

## Planos

As migrações incluem a tabela `Plan`. Foram inseridos 3 planos iniciais:

- **Gratis** – 0 €, 1 bot, 500 mensagens/mês  
- **Basico** – 29,9 €/mês, 3 bots, 5000 mensagens/mês  
- **Pro** – 79,9 €/mês, 10 bots, 20000 mensagens/mês  

Eles aparecem na página de preços e no registo. Para alterar ou adicionar planos, entra como SUPERADMIN em **Admin** → **Planos**.

---

## Criar o primeiro SUPERADMIN

Não existe utilizador nem palavra-passe pré-definidos. Tens duas opções.

### Opção 1: Registo + promover (recomendado)

1. Abre **https://app.conext.click/auth/register** e cria uma conta (nome, email, palavra-passe).
2. No servidor, na pasta do projeto, promove esse email a SUPERADMIN:

```bash
cd /root/conexbot/Documents/CONEXAO
DATABASE_URL="postgresql://admin:password123@127.0.0.1:5434/conext_db?schema=public" \
  npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/promote-admin.ts teu@email.com
```

3. Inicia sessão em **https://app.conext.click** com esse email e palavra-passe. O menu **Admin** fica disponível.

### Opção 2: Criar SUPERADMIN direto (email + senha)

Se preferires criar o utilizador direto na base de dados (sem passar pelo registo na app):

```bash
cd /root/conexbot/Documents/CONEXAO
DATABASE_URL="postgresql://admin:password123@127.0.0.1:5434/conext_db?schema=public" \
  npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/create-superadmin.ts admin@conext.click MinhaSenhaSegura
```

Substitui `admin@conext.click` e `MinhaSenhaSegura` pelo email e senha que quiseres. Depois inicia sessão na app com esses dados.

---

## Notas

- A variável `DATABASE_URL` deve usar a mesma password que está no `.env` / `POSTGRES_PASSWORD` do Docker. No exemplo está `password123`; se a tiveres alterado, usa esse valor.
- Para **apenas promover** um utilizador que já existe:  
  `npx ts-node ... promote-admin.ts email@exemplo.com`  
  (sem senha).

### Se não tiveres Node/npx no servidor

1. Regista-te em **https://app.conext.click/auth/register** (com os planos já disponíveis).
2. Promove o teu email a SUPERADMIN via SQL:

```bash
docker exec -i conext-postgres psql -U admin -d conext_db -c "UPDATE \"Tenant\" SET role = 'SUPERADMIN' WHERE email = 'TEU_EMAIL_AQUI';"
```

Substitui `TEU_EMAIL_AQUI` pelo email com que te registaste.
