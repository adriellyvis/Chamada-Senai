package prezence.dto.suporte;

import prezence.model.StatusSolicitacaoSuporte;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;


@Getter
@AllArgsConstructor
public class SolicitacaoSuporteDTO {

    private Integer id;

    private String protocolo;

    private String nome;

    private String email;

    private String perfil;

    private String assunto;

    private String mensagem;

    private StatusSolicitacaoSuporte status;

    private String respostaGestor;

    private Integer gestorUsuarioId;

    private String gestorNome;

    private LocalDateTime dataCriacao;

    private LocalDateTime dataAtualizacao;
}