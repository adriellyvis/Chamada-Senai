package prezence.service;

import prezence.dto.suporte.AtualizarSolicitacaoSuporteDTO;
import prezence.dto.suporte.CriarSolicitacaoSuporteDTO;
import prezence.dto.suporte.SolicitacaoSuporteDTO;

import prezence.model.SolicitacaoSuporte;
import prezence.model.StatusSolicitacaoSuporte;
import prezence.model.Usuario;

import prezence.repository.SolicitacaoSuporteRepository;
import prezence.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SolicitacaoSuporteService {

    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    private static final Set<String> PERFIS_PERMITIDOS =
            Set.of(
                    "aluno",
                    "professor",
                    "gestor",
                    "outro"
            );


    private final SolicitacaoSuporteRepository
            solicitacaoSuporteRepository;

    private final UsuarioRepository
            usuarioRepository;


    @Transactional
    public SolicitacaoSuporteDTO criar(
            CriarSolicitacaoSuporteDTO dto
    ) {

        String perfil =
                dto.getPerfil()
                        .trim()
                        .toLowerCase();

        if (!PERFIS_PERMITIDOS.contains(perfil)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Perfil informado é inválido"
            );
        }


        SolicitacaoSuporte solicitacao =
                new SolicitacaoSuporte();

        solicitacao.setNome(
                dto.getNome().trim()
        );

        solicitacao.setEmail(
                dto.getEmail()
                        .trim()
                        .toLowerCase()
        );

        solicitacao.setPerfil(
                perfil
        );

        solicitacao.setAssunto(
                dto.getAssunto().trim()
        );

        solicitacao.setMensagem(
                dto.getMensagem().trim()
        );

        solicitacao.setStatus(
                StatusSolicitacaoSuporte.PENDENTE
        );

        solicitacao.setDataCriacao(
                LocalDateTime.now(
                        FUSO_HORARIO
                )
        );


        SolicitacaoSuporte salva =
                solicitacaoSuporteRepository.save(
                        solicitacao
                );


        return converter(
                salva
        );
    }


    public List<SolicitacaoSuporteDTO> listarTodas() {

        return solicitacaoSuporteRepository
                .findAllByOrderByDataCriacaoDesc()
                .stream()
                .map(this::converter)
                .toList();
    }


    @Transactional
    public SolicitacaoSuporteDTO atualizar(
            Integer usuarioGestorId,
            Integer solicitacaoId,
            AtualizarSolicitacaoSuporteDTO dto
    ) {

        if (usuarioGestorId == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Gestor não informado"
            );
        }


        SolicitacaoSuporte solicitacao =
                solicitacaoSuporteRepository
                        .findById(
                                solicitacaoId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Solicitação de suporte não encontrada"
                                )
                        );


        Usuario gestor =
                usuarioRepository
                        .findById(
                                usuarioGestorId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Gestor não encontrado"
                                )
                        );


        if (
                dto.getStatus()
                        == StatusSolicitacaoSuporte.RESOLVIDA
                        &&
                        (
                                dto.getResposta() == null
                                        ||
                                        dto.getResposta().isBlank()
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe uma resposta antes de resolver a solicitação"
            );
        }


        solicitacao.setStatus(
                dto.getStatus()
        );

        solicitacao.setGestorResponsavel(
                gestor
        );

        if (
                dto.getResposta() != null
                        &&
                        !dto.getResposta().isBlank()
        ) {

            solicitacao.setRespostaGestor(
                    dto.getResposta().trim()
            );
        }


        solicitacao.setDataAtualizacao(
                LocalDateTime.now(
                        FUSO_HORARIO
                )
        );


        return converter(
                solicitacaoSuporteRepository.save(
                        solicitacao
                )
        );
    }


    private SolicitacaoSuporteDTO converter(
            SolicitacaoSuporte solicitacao
    ) {

        Usuario gestor =
                solicitacao.getGestorResponsavel();


        return new SolicitacaoSuporteDTO(

                solicitacao.getId(),

                String.format(
                        "SUP-%06d",
                        solicitacao.getId()
                ),

                solicitacao.getNome(),

                solicitacao.getEmail(),

                solicitacao.getPerfil(),

                solicitacao.getAssunto(),

                solicitacao.getMensagem(),

                solicitacao.getStatus(),

                solicitacao.getRespostaGestor(),

                gestor != null
                        ? gestor.getId()
                        : null,

                gestor != null
                        ? gestor.getNome()
                        : null,

                solicitacao.getDataCriacao(),

                solicitacao.getDataAtualizacao()
        );
    }
}