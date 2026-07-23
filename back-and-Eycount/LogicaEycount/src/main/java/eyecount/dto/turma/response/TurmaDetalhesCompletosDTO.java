package eyecount.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
/*
 * DTO TurmaDetalhesCompletosDTO. DTO usado para transportar somente os dados necessarios
 * entre o backend e o front.
 */

@Data
@AllArgsConstructor
public class TurmaDetalhesCompletosDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Descricao detalhada do registro.
    private String descricao;
    // Campo ativa usado por esta classe.
    private Boolean ativa;

    // Colecao de dados relacionada a este objeto.
    private List<ItemDetalheDTO> alunos;
    // Colecao de dados relacionada a este objeto.
    private List<ItemDetalheDTO> professores;
    // Colecao de dados relacionada a este objeto.
    private List<ItemDetalheDTO> disciplinas;
}
