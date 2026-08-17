package br.com.leticia.financeai;

import br.com.leticia.financeai.service.TransactionService;
import org.springframework.stereotype.Component;
import br.com.leticia.financeai.dto.TransactionDTO;
import br.com.leticia.financeai.entity.Transaction;
import br.com.leticia.financeai.enums.Category;
import br.com.leticia.financeai.enums.TransactionType;
import org.springframework.ai.tool.annotation.Tool;

import java.math.BigDecimal;

@Component
public class AiTools {

    private final TransactionService transactionService;

    public AiTools(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @Tool(description = "Cria uma nova transação financeira")

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
}