# Usuários de Teste

Todos os usuários de teste usam a senha: **123456**

## Credenciais

| Email | Papel | Senha |
|-------|-------|-------|
| admin@test.com | Administrador | 123456 |
| vendedor@test.com | Vendedor | 123456 |
| financeiro@test.com | Analista Financeiro | 123456 |
| administrativo@test.com | Staff Administrativo | 123456 |

## Hash bcrypt

Hash bcrypt para a senha 123456:
```
$2b$10$sHjrKbBcpz83uhRRpw31puPvKgQabkDzVYqsCWPSoGTjsTsT8q5oS
```

## SQL para atualizar hashes

```sql
UPDATE users SET passwordHash = '$2b$10$sHjrKbBcpz83uhRRpw31puPvKgQabkDzVYqsCWPSoGTjsTsT8q5oS' 
WHERE email IN ('admin@test.com', 'vendedor@test.com', 'financeiro@test.com', 'administrativo@test.com');
```
