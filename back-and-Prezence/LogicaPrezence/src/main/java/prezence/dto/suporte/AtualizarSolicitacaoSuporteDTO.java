package prezence.dto.suporte;

import prezence.model.StatusSolicitacaoSuporte;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class AtualizarSolicitacaoSuporteDTO {

    @NotNull
    private StatusSolicitacaoSuporte status;


    @Size(max = 3000)
    private String resposta;
}