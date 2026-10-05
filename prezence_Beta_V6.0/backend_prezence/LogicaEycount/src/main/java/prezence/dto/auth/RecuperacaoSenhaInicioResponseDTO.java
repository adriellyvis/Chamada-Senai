package prezence.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;


@Getter
@AllArgsConstructor
public class RecuperacaoSenhaInicioResponseDTO {

    private String challengeId;

    private LocalDateTime expiraEm;

    private String mensagem;
}