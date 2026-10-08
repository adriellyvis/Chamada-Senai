package prezence.service;

import prezence.dto.alerta.AlertaEvasaoDTO;
import prezence.dto.aula.HistoricoAulaDTO;
import prezence.dto.dashboard.FrequenciaTurmaDTO;
import prezence.dto.professor.*;

import prezence.model.Aluno;
import prezence.model.Aula;
import prezence.model.Presenca;
import prezence.model.Professor;
import prezence.model.StatusAula;
import prezence.model.TurmaDisciplina;
import prezence.model.Usuario;

import prezence.repository.AlunoRepository;
import prezence.repository.AulaRepository;
import prezence.repository.BiometriaRepository;
import prezence.repository.PresencaRepository;
import prezence.repository.ProfessorRepository;
import prezence.repository.TurmaDisciplinaRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;


/*
 * Serviço responsável pelas regras de negócio
 * da área do professor.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfessorService {

    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");


    private final ProfessorRepository professorRepository;

    private final TurmaDisciplinaRepository
            turmaDisciplinaRepository;

    private final AlunoRepository alunoRepository;

    private final AulaRepository aulaRepository;

    private final PresencaRepository presencaRepository;

    private final BiometriaRepository biometriaRepository;


    // =====================================================
    // DASHBOARD
    // =====================================================

    public ProfessorDashboardDTO dashboard(
            Integer usuarioId
    ) {

        Professor professor =
                buscarProfessorPorUsuario(
                        usuarioId
                );


        List<TurmaDisciplina> vinculos =
                turmaDisciplinaRepository
                        .findByProfessorId(
                                professor.getId()
                        );


        Integer totalTurmas =
                vinculos.size();


        Integer totalAlunos =
                vinculos.stream()

                        .map(vinculo ->
                                alunoRepository
                                        .findByTurmaId(
                                                vinculo
                                                        .getTurma()
                                                        .getId()
                                        )
                                        .size()
                        )

                        .reduce(
                                0,
                                Integer::sum
                        );


        List<HistoricoAulaDTO> historico =
                aulaRepository
                        .buscarHistoricoPorProfessor(
                                usuarioId
                        );


        Integer aulasRealizadas =
                historico.size();


        Double frequenciaMedia =
                presencaRepository
                        .calcularFrequenciaPorProfessor(
                                professor.getId()
                        );


        if (frequenciaMedia == null) {

            frequenciaMedia =
                    0.0;
        }


        List<HistoricoAulaDTO> aulasRecentes =
                historico.stream()
                        .limit(5)
                        .toList();


        List<AlertaEvasaoDTO> alunosRisco =
                presencaRepository
                        .buscarAlunosRiscoProfessor(
                                professor.getId()
                        );


        return new ProfessorDashboardDTO(
                totalTurmas,
                totalAlunos,

                Math.round(
                        frequenciaMedia * 10.0
                ) / 10.0,

                aulasRealizadas,
                aulasRecentes,
                alunosRisco
        );
    }


    // =====================================================
    // BUSCAR PROFESSOR PELO USUÁRIO
    // =====================================================

    public Professor buscarProfessorPorUsuario(
            Integer usuarioId
    ) {

        if (usuarioId == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }


        return professorRepository
                .findByUsuarioId(
                        usuarioId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Professor não encontrado"
                        )
                );
    }


    // =====================================================
    // PERFIL
    // =====================================================

    public ProfessorPerfilDTO buscarPerfil(
            Integer usuarioId
    ) {

        Professor professor =
                buscarProfessorPorUsuario(
                        usuarioId
                );


        Usuario usuario =
                professor.getUsuario();


        if (usuario == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Professor não possui usuário vinculado"
            );
        }


        List<TurmaDisciplina> vinculosProfessor =
                turmaDisciplinaRepository
                        .findByProfessorId(
                                professor.getId()
                        );


        Integer totalTurmas =
                Math.toIntExact(
                        vinculosProfessor
                                .stream()

                                .map(vinculo ->
                                        vinculo
                                                .getTurma()
                                                .getId()
                                )

                                .distinct()
                                .count()
                );


        Integer totalDisciplinas =
                Math.toIntExact(
                        vinculosProfessor
                                .stream()

                                .map(vinculo ->
                                        vinculo
                                                .getDisciplina()
                                                .getId()
                                )

                                .distinct()
                                .count()
                );


        Integer totalAlunos =
                Math.toIntExact(
                        vinculosProfessor
                                .stream()

                                .map(vinculo ->
                                        vinculo
                                                .getTurma()
                                                .getId()
                                )

                                .distinct()

                                .flatMap(turmaId ->
                                        alunoRepository
                                                .findByTurmaId(
                                                        turmaId
                                                )
                                                .stream()
                                )

                                .map(Aluno::getId)

                                .distinct()
                                .count()
                );


        Integer totalAulas =
                aulaRepository
                        .buscarHistoricoPorProfessor(
                                usuarioId
                        )
                        .size();


        List<ProfessorVinculoPerfilDTO> vinculos =
                vinculosProfessor
                        .stream()

                        .map(vinculo ->
                                new ProfessorVinculoPerfilDTO(

                                        vinculo.getId(),

                                        vinculo
                                                .getTurma()
                                                .getId(),

                                        vinculo
                                                .getTurma()
                                                .getNome(),

                                        vinculo
                                                .getDisciplina()
                                                .getId(),

                                        vinculo
                                                .getDisciplina()
                                                .getNome()
                                )
                        )

                        .toList();


        String perfil =
                usuario.getPerfil() != null
                        ? usuario
                        .getPerfil()
                        .getNome()
                        : "professor";


        return new ProfessorPerfilDTO(

                usuario.getId(),

                professor.getId(),

                usuario.getNome(),

                usuario.getEmail(),

                professor.getEspecialidade(),

                perfil,

                Boolean.TRUE.equals(
                        usuario.getAtivo()
                ),

                totalTurmas,

                totalDisciplinas,

                totalAlunos,

                totalAulas,

                vinculos
        );
    }


    // =====================================================
    // TURMAS
    // =====================================================

    public List<TurmaProfessorDTO> listarTurmas(
            Integer usuarioId
    ) {

        Professor professor =
                buscarProfessorPorUsuario(
                        usuarioId
                );

        return turmaDisciplinaRepository
                .findByProfessorId(
                        professor.getId()
                )
                .stream()
                .map(vinculo -> {

                    Integer turmaId =
                            vinculo
                                    .getTurma()
                                    .getId();

                    long totalAlunos =
                            alunoRepository
                                    .findByTurmaId(turmaId)
                                    .size();

                    return new TurmaProfessorDTO(
                            vinculo.getId(),
                            turmaId,
                            vinculo.getTurma().getNome(),
                            vinculo.getDisciplina().getNome(),
                            totalAlunos,
                            vinculo.getTurma().getSala()
                    );
                })
                .toList();
    }


    // =====================================================
    // ALUNOS POR TURMA/DISCIPLINA
    // =====================================================

    public List<Aluno> listarAlunos(
            Integer usuarioId,
            Integer turmaDisciplinaId
    ) {

        if (usuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }

        if (turmaDisciplinaId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Turma/Disciplina não informada"
            );
        }

        buscarProfessorPorUsuario(
                usuarioId
        );

        TurmaDisciplina turmaDisciplina =
                turmaDisciplinaRepository
                        .findByIdAndProfessor_Usuario_Id(
                                turmaDisciplinaId,
                                usuarioId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Você não possui acesso a esta turma/disciplina"
                                )
                        );

        if (turmaDisciplina.getTurma() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Turma/Disciplina não possui turma vinculada"
            );
        }

        return alunoRepository.findByTurmaId(
                turmaDisciplina
                        .getTurma()
                        .getId()
        );
    }


    // =====================================================
    // FREQUÊNCIA DAS TURMAS
    // =====================================================

    public List<FrequenciaTurmaDTO>
    buscarFrequenciaTurmas(
            Integer usuarioId
    ) {

        Professor professor =
                buscarProfessorPorUsuario(
                        usuarioId
                );


        return presencaRepository
                .buscarFrequenciaTurmasProfessor(
                        professor.getId()
                );
    }



    // =====================================================
    // HISTÓRICO
    // =====================================================

    public List<HistoricoAulaDTO> listarHistorico(
            Integer usuarioId
    ) {

        buscarProfessorPorUsuario(
                usuarioId
        );


        return aulaRepository
                .buscarHistoricoPorProfessor(
                        usuarioId
                );
    }


    // =====================================================
    // DESEMPENHO
    // =====================================================

    public List<DesempenhoTurmaDTO> desempenhoTurmas(
            Integer usuarioId,
            Integer turmaId,
            String periodo
    ) {

        buscarProfessorPorUsuario(
                usuarioId
        );


        return presencaRepository
                .buscarDesempenhoTurmas(
                        usuarioId,
                        turmaId
                );
    }


    // =====================================================
    // ALUNOS DO PROFESSOR
    // =====================================================

    public List<AlunoProfessorDTO> listarAlunosProfessor(
            Integer usuarioId,
            Integer turmaId
    ) {

        buscarProfessorPorUsuario(
                usuarioId
        );


        return alunoRepository
                .buscarAlunosDoProfessor(
                        usuarioId,
                        turmaId
                );
    }


    // =====================================================
    // PRESENÇAS DA AULA
    // =====================================================

    public List<PresencaAlunoProfessorDTO>
    listarPresencasDaAula(

            Integer usuarioId,
            Integer aulaId
    ) {

        if (usuarioId == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }


        if (aulaId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aula não informada"
            );
        }


        /*
         * Confirma que realmente existe um professor
         * vinculado ao usuário autenticado.
         */
        buscarProfessorPorUsuario(
                usuarioId
        );


        Aula aula =
                aulaRepository
                        .findById(
                                aulaId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aula não encontrada"
                                )
                        );


        /*
         * Impede que um professor consulte a chamada
         * pertencente a outro professor.
         */
        validarProfessorResponsavelPelaAula(
                usuarioId,
                aula
        );


        return presencaRepository
                .findByAula_Id(
                        aulaId
                )

                .stream()

                .map(
                        this::converterPresencaProfessor
                )

                .toList();
    }


    // =====================================================
    // CONVERTER PRESENÇA PARA DTO
    // =====================================================

    private PresencaAlunoProfessorDTO
    converterPresencaProfessor(
            Presenca presenca
    ) {

        if (presenca == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Registro de presença inválido"
            );
        }


        Aluno aluno =
                presenca.getAluno();


        if (aluno == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Existe uma presença sem aluno vinculado"
            );
        }


        Usuario usuarioAluno =
                aluno.getUsuario();


        if (usuarioAluno == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "O aluno da presença não possui usuário vinculado"
            );
        }


        String status =
                presenca.getStatus() != null
                        ? presenca
                        .getStatus()
                        .name()
                        : "NAO_REGISTRADO";


        String metodo =
                presenca.getMetodo() != null
                        ? presenca
                        .getMetodo()
                        .name()
                        : "NAO_INFORMADO";


        boolean validacaoBiometrica =
                Boolean.TRUE.equals(
                        presenca
                                .getValidacaoBiometrica()
                );


        return new PresencaAlunoProfessorDTO(

                aluno.getId(),

                usuarioAluno.getNome(),

                status,

                metodo,

                validacaoBiometrica
        );
    }


    // =====================================================
    // VALIDAR PROFESSOR DA AULA
    // =====================================================

    private void validarProfessorResponsavelPelaAula(
            Integer usuarioProfessorId,
            Aula aula
    ) {

        if (
                aula.getTurmaDisciplina() == null
                        ||
                        aula
                                .getTurmaDisciplina()
                                .getProfessor() == null
                        ||
                        aula
                                .getTurmaDisciplina()
                                .getProfessor()
                                .getUsuario() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A aula não possui professor responsável"
            );
        }


        Integer usuarioResponsavelId =
                aula
                        .getTurmaDisciplina()
                        .getProfessor()
                        .getUsuario()
                        .getId();


        if (
                !usuarioProfessorId.equals(
                        usuarioResponsavelId
                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Esta aula pertence a outro professor"
            );
        }
    }
}