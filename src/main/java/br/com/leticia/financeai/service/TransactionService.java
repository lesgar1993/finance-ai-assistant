package br.com.leticia.financeai.service;

import org.springframework.stereotype.Service;
import br.com.leticia.financeai.entity.Transaction;
import br.com.leticia.financeai.repository.TransactionRepository;
import br.com.leticia.financeai.dto.TransactionDTO;
import br.com.leticia.financeai.enums.TransactionType;
import br.com.leticia.financeai.exception.ResourceNotFoundException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    public void delete(Long id) {
        transactionRepository.deleteById(id);
    }

    public Transaction update(Long id, TransactionDTO dto) {
        Transaction existing = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        existing.setDescription(dto.getDescription());
        existing.setAmount(dto.getAmount());
        existing.setType(dto.getType());
        existing.setCategory(dto.getCategory());

        // Atualiza data se informada, senão mantém a existente
        if (dto.getTransactionDate() != null) {
            existing.setCreatedAt(dto.getTransactionDate().atStartOfDay());
        }

        return transactionRepository.save(existing);
    }

    public Transaction save(TransactionDTO dto) {
        Transaction transaction = new Transaction();

        transaction.setDescription(dto.getDescription());
        transaction.setAmount(dto.getAmount());
        transaction.setType(dto.getType());
        transaction.setCategory(dto.getCategory());

        // Usa a data informada ou a data/hora atual como padrão
        LocalDateTime dateTime = (dto.getTransactionDate() != null)
                ? dto.getTransactionDate().atStartOfDay()
                : LocalDateTime.now();
        transaction.setCreatedAt(dateTime);

        return transactionRepository.save(transaction);
    }

    public BigDecimal getTotalByType(TransactionType type) {
        return transactionRepository.sumByType(type);
    }
}