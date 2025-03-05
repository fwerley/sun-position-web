# Sun Position API

A Sun Position API é uma API no formato RESTful que dá acesso ao banco de dados e funcionalidades da biblioteca JavaScript.

## Endpoints

- `/user/register` - Registrar um novo usuário
- `/user/login` - Login de usuário
- `/project/create` - Criar um novo projeto
- `/project/{id}` - Obter detalhes de um projeto

## Exemplo de Uso

```bash
curl -X POST https://api.sunposition.com/user/register \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "password123"}'