package br.com.leticia.financeai;

import br.com.leticia.financeai.service.TransactionService;
import org.springframework.stereotype.Component;
import br.com.leticia.financeai.dto.TransactionDTO;
import br.com.leticia.financeai.entity.Transaction;
import br.com.leticia.financeai.enums.Category;
import br.com.leticia.financeai.enums.TransactionType;
import org.springframework.ai.tool.annotation.Tool;

import java.math.BigDecimal;
import java.util.List;

@Component
public class AiTools {

    private final TransactionService transactionService;

    public AiTools(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ─────────────────────────────────────────────
    // FERRAMENTA: Criar transação
    // ─────────────────────────────────────────────

    @Tool(description = "Cria uma nova transação financeira no sistema")
    public Transaction createTransaction(
            String description,
            BigDecimal amount,
            TransactionType type,
            Category category) {

        TransactionDTO dto = new TransactionDTO();
        dto.setDescription(description);
        dto.setAmount(amount);
        dto.setType(type);
        dto.setCategory(category);

        return transactionService.save(dto);
    }

    // ─────────────────────────────────────────────
    // FERRAMENTA: Listar todas as transações
    // ─────────────────────────────────────────────

    @Tool(description = """
            Retorna a lista completa de todas as transações financeiras cadastradas,
            incluindo descrição, valor, tipo (INCOME ou EXPENSE) e categoria.
            Use esta ferramenta para responder perguntas como:
            'quais foram minhas despesas?', 'mostre minhas transações',
            'quais foram minhas maiores despesas?', 'analise minhas finanças'.
            """)
    public List<Transaction> getAllTransactions() {
        return transactionService.findAll();
    }

    // ─────────────────────────────────────────────
    // FERRAMENTA: Total de receitas
    // ─────────────────────────────────────────────

    @Tool(description = """
            Retorna o valor total somado de todas as receitas (INCOME) cadastradas.
            Use para responder perguntas como:
            'quanto recebi?', 'qual o total de receitas?', 'quanto entrou?'.
            """)
    public BigDecimal getTotalIncome() {
        return transactionService.getTotalByType(TransactionType.INCOME);
    }

    // ─────────────────────────────────────────────
    // FERRAMENTA: Total de despesas
    // ─────────────────────────────────────────────

    @Tool(description = """
            Retorna o valor total somado de todas as despesas (EXPENSE) cadastradas.
            Use para responder perguntas como:
            'quanto gastei?', 'qual o total de despesas?', 'quanto saiu?'.
            """)
    public BigDecimal getTotalExpense() {
        return transactionService.getTotalByType(TransactionType.EXPENSE);
    }

    // ─────────────────────────────────────────────
    // FERRAMENTA: Saldo atual
    // ─────────────────────────────────────────────

    @Tool(description = """
            Calcula e retorna o saldo atual (receitas menos despesas).
            Use para responder perguntas como:
            'qual meu saldo?', 'como estão minhas finanças?',
            'estou no positivo ou negativo?'.
            """)
    public BigDecimal getBalance() {
        BigDecimal income  = transactionService.getTotalByType(TransactionType.INCOME);
        BigDecimal expense = transactionService.getTotalByType(TransactionType.EXPENSE);
        return income.subtract(expense);
    }
}
