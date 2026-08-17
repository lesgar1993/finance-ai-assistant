package br.com.leticia.financeai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiController {

    private final ChatClient chatClient;

    public AiController(ChatClient.Builder builder, AiTools aiTools) {
        this.chatClient = builder
                .defaultTools(aiTools)
                .build();
    }

    @GetMapping("/ai")
    public String askAI(@RequestParam String message) {

        return chatClient
                .prompt()
                .system("""
                    Você é um assistente financeiro.
                    Quando registrar uma transação com sucesso, responda de forma curta,
                    clara e amigável, informando o valor, o tipo e a categoria.
                    Não repita a frase original do usuário.
                    """)
                .user(message)
                .call()
                .content();
    }

}
