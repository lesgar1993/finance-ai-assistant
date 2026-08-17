# Finance AI Assistant

API inteligente para gerenciamento de transações financeiras, desenvolvida com Java e Spring Boot, com integração de Inteligência Artificial e reconhecimento de voz.

O projeto permite registrar transações financeiras utilizando tanto endpoints REST tradicionais quanto linguagem natural, incluindo comandos enviados por áudio.

## 🎯 Objetivo

O objetivo do projeto é desenvolver uma API capaz de auxiliar no gerenciamento financeiro de forma simples e inteligente.

O usuário pode informar, por exemplo:

> "Registre uma despesa de 80 reais em alimentação."

A aplicação utiliza Inteligência Artificial para interpretar a solicitação, identificar os dados financeiros e registrar automaticamente a transação no banco de dados.

Também é possível utilizar áudio como entrada. Nesse caso, o áudio é transcrito pelo Whisper antes de ser enviado para a IA.

## 🚀 Tecnologias utilizadas

* Java 22
* Spring Boot
* Spring Data JPA
* Spring AI
* Ollama
* Qwen3 4B
* Whisper
* H2 Database
* Maven
* Swagger / OpenAPI
* Git e GitHub

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura organizada em camadas:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
H2 Database
```

Para as funcionalidades de Inteligência Artificial:

```text
Usuário
   ↓
Texto ou Áudio
   ↓
Whisper
   ↓
Qwen3
   ↓
AiTools
   ↓
TransactionService
   ↓
H2 Database
```

## 🤖 Inteligência Artificial

A aplicação utiliza o modelo Qwen3 4B executado localmente através do Ollama.

A IA é integrada ao Spring AI e possui acesso a ferramentas da aplicação por meio da classe `AiTools`.

Uma das ferramentas disponíveis permite criar uma nova transação financeira.

Exemplo:

```text
Usuário:
"Registre uma despesa de 80 reais em alimentação."

IA:
interpreta a intenção e os dados da transação

AiTools:
cria a transação

Banco:
R$ 80,00
Tipo: EXPENSE
Categoria: FOOD
```

Após o registro, a aplicação retorna uma confirmação amigável ao usuário.

## 🎙️ Reconhecimento de voz

O projeto também possui integração com o Whisper.

O fluxo de áudio funciona da seguinte maneira:

```text
Arquivo de áudio
      ↓
Whisper
      ↓
Transcrição
      ↓
Qwen3
      ↓
Interpretação da solicitação
      ↓
AiTools
      ↓
Transação
```

Endpoint:

```text
POST /ai/audio
```

O arquivo de áudio é enviado como `multipart/form-data`.

## 💰 Funcionalidades

### Transações

* Criar transação
* Listar transações
* Buscar transação por ID
* Atualizar transação
* Excluir transação
* Validar dados das transações

### Resumo financeiro

A API possui um endpoint para consulta do resumo financeiro:

* Total de receitas
* Total de despesas
* Saldo

### Inteligência Artificial

* Conversação com a IA
* Registro de transações através de linguagem natural
* Utilização de ferramentas pela IA
* Respostas contextualizadas

### Áudio

* Upload de arquivo de áudio
* Transcrição utilizando Whisper
* Integração da transcrição com a IA
* Registro de transações a partir de comandos de voz

## 📌 Principais endpoints

### Transações

```text
POST   /transactions
GET    /transactions
GET    /transactions/{id}
PUT    /transactions/{id}
DELETE /transactions/{id}
```

### Resumo financeiro

```text
GET /transactions/summary
```

### Inteligência Artificial

```text
GET /ai?message={mensagem}
```

### Áudio

```text
POST /ai/audio
```

### Swagger

Após iniciar a aplicação:

```text
http://localhost:8080/swagger-ui/index.html
```

## ⚙️ Configuração

### Java

É necessário possuir o Java 22 instalado.

Verifique com:

```bash
java -version
```

### Ollama

O projeto utiliza o modelo:

```text
qwen3:4b
```

O modelo pode ser instalado com:

```bash
ollama pull qwen3:4b
```

Verifique os modelos instalados com:

```bash
ollama list
```

### Whisper

É necessário instalar o Whisper e configurar os caminhos do executável e do modelo no arquivo:

```text
application.properties
```

Utilize o arquivo:

```text
application-example.properties
```

como referência para configuração.

### Executando o projeto

No Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

A aplicação será iniciada na porta:

```text
8080
```

## 🗄️ Banco de dados

O projeto utiliza o H2 Database em memória para armazenamento das transações.

Console do H2:

```text
http://localhost:8080/h2-console
```

Configuração:

```text
JDBC URL: jdbc:h2:mem:financeai
User: sa
Password:
```

## 🧪 Exemplo de uso

Uma solicitação pode ser enviada para a API:

```text
GET /ai?message=Registre uma despesa de 80 reais em alimentação
```

A IA interpreta a solicitação e utiliza a ferramenta de criação de transações.

Resultado esperado:

```text
Sua transação de R$80 em alimentação foi registrada com sucesso como despesa!
```

## 📚 Estrutura do projeto

```text
src
├── main
│   ├── java
│   │   └── br.com.leticia.financeai
│   │       ├── controller
│   │       ├── dto
│   │       ├── entity
│   │       ├── enums
│   │       ├── exception
│   │       ├── repository
│   │       ├── service
│   │       ├── AiController.java
│   │       ├── AiTools.java
│   │       ├── WhisperController.java
│   │       └── FinanceAiAssistantApplication.java
│   │
│   └── resources
│       ├── application.properties
│       └── application-example.properties
│
└── test
    └── java
```

## 👩‍💻 Projeto

Projeto desenvolvido como parte do aprendizado em Desenvolvimento de Sistemas, com foco em desenvolvimento de APIs, Java, Spring Boot e integração com Inteligência Artificial.

**Finance AI Assistant**

Desenvolvido por Letícia Sgarbosa.
