package eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * Arquivo legado GestorTurmaAlunoDTO. Classe antiga mantida apenas como referencia. Ela nao
 * participa do fluxo principal atual.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GestorTurmaAlunoDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Matricula academica do aluno.
    private String matricula;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;
    // Status atual do registro.
    private String status;

}
