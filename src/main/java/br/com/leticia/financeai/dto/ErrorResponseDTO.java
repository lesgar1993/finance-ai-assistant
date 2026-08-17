package br.com.leticia.financeai.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class ErrorResponseDTO {

    private LocalDateTime timestamp;
    private Integer status;
    private String message;
    private Map<String, String> errors;


    public ErrorResponseDTO(LocalDateTime timestamp,
                            Integer status,
                            String message,
                            Map<String, String> errors) {
        this.timestamp = timestamp;
        this.status = status;
        this.message = message;
        this.errors = errors;
    }


    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public Integer getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}