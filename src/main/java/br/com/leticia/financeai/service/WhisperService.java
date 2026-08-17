package br.com.leticia.financeai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class WhisperService {

    @Value("${whisper.executable}")
    private String whisperExecutable;

    @Value("${whisper.model}")
    private String whisperModel;

    public String transcribe(String audioPath) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                whisperExecutable,
                "-m", whisperModel,
                "-f", audioPath,
                "-l", "pt",
                "--no-timestamps"
        );

        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        StringBuilder result = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {

            String line;

            while ((line = reader.readLine()) != null) {

                // Ignora as linhas de informações do Whisper
                if (!line.startsWith("whisper_")
                        && !line.startsWith("ggml_")
                        && !line.startsWith("system_info")
                        && !line.startsWith("main:")) {

                    result.append(line).append(" ");
                }
            }
        }

        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Erro ao executar o Whisper.");
        }

        return result.toString().trim();
    }
}