package br.com.leticia.financeai;

import br.com.leticia.financeai.entity.Transaction;
import br.com.leticia.financeai.enums.TransactionType;
import br.com.leticia.financeai.service.TransactionService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class AiController {

    private final ChatClient chatClient;
    private final TransactionService transactionService;

    public AiController(ChatClient.Builder builder, TransactionService transactionService) {
        // Sem .defaultTools() — não usamos tool calling pois o llama3.2:1b
        // não suporta esse recurso. Em vez disso, injetamos os dados no prompt.
        this.chatClient = builder.build();
        this.transactionService = transactionService;
    }

    @GetMapping("/ai")
    public String askAI(@RequestParam String message) {

        // ── 1. Busca os dados financeiros reais do banco ──
        List<Transaction> transactions = transactionService.findAll();
        BigDecimal totalIncome  = transactionService.getTotalByType(TransactionType.INCOME);
        BigDecimal totalExpense = transactionService.getTotalByType(TransactionType.EXPENSE);
        BigDecimal balance      = totalIncome.subtract(totalExpense);

        // ── 2. Formata a lista de transações como texto ──
        String txList = transactions.isEmpty()
                ? "Nenhuma transação cadastrada ainda."
                : transactions.stream()
                    .map(tx -> String.format("- %s: R$ %.2f (%s / %s)",
                            tx.getDescription(),
                            tx.getAmount(),
                            tx.getType() == TransactionType.INCOME ? "Receita" : "Despesa",
                            tx.getCategory()))
                    .collect(Collectors.joining("\n"));

        // ── 3. Monta o contexto financeiro que vai no system prompt ──
        String financialContext = String.format("""
                DADOS FINANCEIROS REAIS DO USUÁRIO:
                - Total de receitas: R$ %.2f
                - Total de despesas: R$ %.2f
                - Saldo atual: R$ %.2f
                
                LISTA DE TRANSAÇÕES:
                %s
                """,
                totalIncome, totalExpense, balance, txList);

        // ── 4. Chama a IA com os dados já no contexto ──
        String response = chatClient
                .prompt()
                .system("""
                        Você é um assistente financeiro chamado Finance AI.
                        Responda SEMPRE em português brasileiro.
                        Seja direto, claro e amigável.
                        Use APENAS os dados financeiros fornecidos abaixo para responder.
                        Não invente valores. Não repita a pergunta do usuário.
                        """
                        + "\n\n" + financialContext)
                .user(message)
                .call()
                .content();

        // ── 5. Garante resposta não nula ──
        if (response == null || response.isBlank()) {
            return "Desculpe, não consegui processar sua pergunta. Tente novamente.";
        }

        return response;
    }
}
