package prezence.dto.biometria;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitacaoPresencaBiometricaDTO {

    private Integer id;

    private Integer alunoId;
    private Integer alunoUsuarioId;
    private String alunoNome;

    private Integer aulaId;

    private Integer turmaId;
    private String turmaNome;

    private Integer disciplinaId;
    private String disciplinaNome;

    private Integer professorUsuarioId;
    private String professorNome;

    private String status;

    /*
     * PRESENTE ou ATRASADO.
     */
    private String statusSugerido;

    private LocalDateTime horarioSolicitacao;

    private LocalDateTime horarioDecisao;

    private String motivoRecusa;
}