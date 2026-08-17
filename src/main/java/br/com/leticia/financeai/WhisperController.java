package br.com.leticia.financeai;

import br.com.leticia.financeai.service.WhisperService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
public class WhisperController {

    private final WhisperService whisperService;
    private final ChatClient chatClient;

    public WhisperController(
            WhisperService whisperService,
            ChatClient.Builder builder,
            AiTools aiTools) {

        this.whisperService = whisperService;

        this.chatClient = builder
                .defaultTools(aiTools)
                .build();
    }

    @GetMapping("/whisper-test")
    public String testWhisper() throws Exception {

        return whisperService.transcribe(
                "C:/Whisper/audio.wav"
        );
    }

    @PostMapping("/ai/audio")
    public String transcribeAudio(
            @RequestParam("file") MultipartFile file) throws Exception {

        Path tempFile = Files.createTempFile("audio-", ".wav");

        try {

            file.transferTo(tempFile.toFile());

            // 1. Whisper transforma áudio em texto
            String transcription = whisperService.transcribe(
                    tempFile.toString()
            );

            // 2. Qwen interpreta o texto e pode utilizar as ferramentas
            return chatClient
                    .prompt()
                    .user(transcription)
                    .call()
                    .content();

        } finally {

            Files.deleteIfExists(tempFile);
        }
    }
}