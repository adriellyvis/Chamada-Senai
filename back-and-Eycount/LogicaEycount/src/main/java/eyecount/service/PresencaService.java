package eyecount.service;

import eyecount.dto.presenca.PresencaDTO;
import eyecount.model.*;
import eyecount.repository.AlunoRepository;
import eyecount.repository.AulaRepository;
import eyecount.repository.PresencaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

/*
 * Servico responsavel pelo registro de presenca dos alunos.
 *
 * Esta classe:
 * - valida os dados recebidos;
 * - busca o aluno e a aula;
 * - verifica se a aula ainda esta aberta;
 * - confirma se o aluno pertence a turma da aula;
 * - cria ou atualiza um registro de presenca;
 * - informa se houve validacao biometrica.
 */
@Service
@RequiredArgsConstructor
public class PresencaService {

    // Repository usado para consultar e salvar registros de presenca.
    private final PresencaRepository presencaRepository;

    // Repository usado para buscar a aula relacionada ao registro.
    private final AulaRepository aulaRepository;

    // Repository usado para buscar o aluno relacionado ao registro.
    private final AlunoRepository alunoRepository;

    /*
     * Registra ou atualiza a presenca de um aluno em uma aula.
     *
     * Antes de salvar, o metodo valida:
     * - dados obrigatorios;
     * - existencia do aluno;
     * - existencia da aula;
     * - status da aula;
     * - turma do aluno;
     * - metodo e status recebidos.
     */
    public Presenca registrar(
            PresencaDTO dto
    ) {

        /*
         * Verifica se todos os dados obrigatorios foram enviados.
         *
         * Sao obrigatorios:
         * - alunoId;
         * - aulaId;
         * - status;
         * - metodo.
         */
        if (
                dto.getAlunoId() == null ||
                        dto.getAulaId() == null ||
                        dto.getStatus() == null ||
                        dto.getMetodo() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da presença incompletos"
            );
        }

        /*
         * Busca o aluno pelo ID recebido.
         *
         * Caso o aluno nao exista, retorna erro 404.
         */
        Aluno aluno =
                alunoRepository
                        .findById(dto.getAlunoId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        /*
         * Busca a aula pelo ID recebido.
         *
         * Caso a aula nao exista, retorna erro 404.
         */
        Aula aula =
                aulaRepository
                        .findById(dto.getAulaId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aula não encontrada"
                                )
                        );

        /*
         * Permite o registro somente quando
         * a aula esta com status EM_ANDAMENTO.
         *
         * Aulas encerradas ou canceladas nao aceitam presenca.
         */
        if (
                aula.getStatus() !=
                        StatusAula.EM_ANDAMENTO
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível registrar presença em aula encerrada"
            );
        }

        // Recupera o ID da turma em que o aluno esta matriculado.
        Integer turmaDoAlunoId =
                aluno.getTurma().getId();

        /*
         * Recupera o ID da turma ligada a aula.
         *
         * O caminho passa pelo vinculo TurmaDisciplina.
         */
        Integer turmaDaAulaId =
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getId();

        /*
         * Compara a turma do aluno com a turma da aula.
         *
         * Quando os IDs sao diferentes,
         * o aluno nao pode registrar presenca nessa aula.
         */
        if (
                !turmaDoAlunoId.equals(
                        turmaDaAulaId
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não pertence à turma desta aula"
            );
        }

        /*
         * Procura um registro existente usando:
         * - alunoId;
         * - aulaId.
         *
         * Se encontrar, o mesmo registro sera atualizado.
         * Se nao encontrar, cria uma nova entidade Presenca.
         */
        Presenca presenca =
                presencaRepository
                        .findByAluno_IdAndAula_Id(
                                dto.getAlunoId(),
                                dto.getAulaId()
                        )
                        .orElse(new Presenca());

        // Vincula a presenca ao aluno encontrado.
        presenca.setAluno(aluno);

        // Vincula a presenca a aula encontrada.
        presenca.setAula(aula);

        /*
         * Usa diretamente o status recebido no DTO.
         *
         * Neste ponto, o backend ainda nao calcula
         * PRESENTE ou ATRASADO usando a tolerancia do horario.
         */
        presenca.setStatus(
                dto.getStatus()
        );

        /*
         * Define o metodo de registro recebido.
         *
         * Exemplos:
         * - MANUAL;
         * - BIOMETRIA.
         */
        presenca.setMetodo(
                dto.getMetodo()
        );

        /*
         * Registra a data e hora atuais.
         *
         * Quando uma presenca existente e atualizada,
         * este horario tambem e substituido.
         */
        presenca.setHorarioRegistro(
                LocalDateTime.now()
        );

        /*
         * Marca validacao biometrica como true
         * somente quando o metodo e BIOMETRIA.
         *
         * Qualquer outro metodo resulta em false.
         */
        presenca.setValidacaoBiometrica(
                dto.getMetodo() ==
                        MetodoPresenca.BIOMETRIA
        );

        /*
         * Salva o novo registro ou atualiza
         * a presenca que ja existia.
         */
        return presencaRepository.save(
                presenca
        );
    }
}