package br.com.leticia.financeai.controller;

import jakarta.validation.Valid;
import br.com.leticia.financeai.entity.Transaction;
import br.com.leticia.financeai.service.TransactionService;
import org.springframework.web.bind.annotation.*;
import br.com.leticia.financeai.dto.TransactionDTO;
import br.com.leticia.financeai.enums.TransactionType;
import java.math.BigDecimal;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public Transaction save(@Valid @RequestBody TransactionDTO transactionDTO) {
        return transactionService.save(transactionDTO);
    }

    @GetMapping
    public List<Transaction> findAll() {
        return transactionService.findAll();
    }

    @GetMapping("/summary")
    public Map<String, BigDecimal> summary() {

        BigDecimal totalIncome =
                transactionService.getTotalByType(TransactionType.INCOME);

        BigDecimal totalExpense =
                transactionService.getTotalByType(TransactionType.EXPENSE);

        BigDecimal balance = totalIncome.subtract(totalExpense);

        return Map.of(
                "totalIncome", totalIncome,
                "totalExpense", totalExpense,
                "balance", balance
        );
    }

    @GetMapping("/{id}")
    public Transaction findById(@PathVariable Long id) {
        return transactionService.findById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        transactionService.delete(id);
    }

    @PutMapping("/{id}")
    public Transaction update(@PathVariable Long id,
                              @RequestBody Transaction transaction) {
        return transactionService.update(id, transaction);
    }

}