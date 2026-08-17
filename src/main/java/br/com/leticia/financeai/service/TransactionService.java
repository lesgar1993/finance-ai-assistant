package br.com.leticia.financeai.service;

import org.springframework.stereotype.Service;
import br.com.leticia.financeai.entity.Transaction;
import br.com.leticia.financeai.repository.TransactionRepository;
import br.com.leticia.financeai.dto.TransactionDTO;
import br.com.leticia.financeai.enums.TransactionType;
import java.math.BigDecimal;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Transaction save(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    public List<Transaction> findAll() {
        return transactionRepository.findAll();
    }

    public Transaction findById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public void delete(Long id) {
        transactionRepository.deleteById(id);
    }

    public Transaction update(Long id, Transaction transaction) {

        Transaction existing = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        existing.setDescription(transaction.getDescription());
        existing.setAmount(transaction.getAmount());
        existing.setType(transaction.getType());
        existing.setCategory(transaction.getCategory());

        return transactionRepository.save(existing);
    }

    public Transaction save(TransactionDTO dto) {

        Transaction transaction = new Transaction();

        transaction.setDescription(dto.getDescription());
        transaction.setAmount(dto.getAmount());
        transaction.setType(dto.getType());
        transaction.setCategory(dto.getCategory());

        return transactionRepository.save(transaction);
    }

    public BigDecimal getTotalByType(TransactionType type) {
        return transactionRepository.sumByType(type);
    }
}