package prezence.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "solicitacoes_presenca_biometrica",
        indexes = {

                @Index(
                        name = "idx_solicitacao_aluno_aula",
                        columnList = "aluno_id,aula_id"
                ),

                @Index(
                        name = "idx_solicitacao_status",
                        columnList = "status"
                )
        }
)
public class SolicitacaoPresencaBiometrica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    // =====================================================
    // ALUNO
    // =====================================================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "aluno_id",
            nullable = false
    )
    private Aluno aluno;


    // =====================================================
    // AULA
    // =====================================================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "aula_id",
            nullable = false
    )
    private Aula aula;


    // =====================================================
    // STATUS DA SOLICITAÇÃO
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private StatusSolicitacaoBiometrica status;


    /*
     * Status calculado no momento em que o aluno
     * fez a biometria.
     *
     * IMPORTANTE:
     * esse valor não deve ser recalculado quando
     * o professor confirmar.
     */
    @Enumerated(EnumType.STRING)
    @Column(
            name = "status_sugerido",
            nullable = false,
            length = 30
    )
    private StatusPresenca statusSugerido;


    // =====================================================
    // HORÁRIOS
    // =====================================================

    @Column(
            name = "horario_solicitacao",
            nullable = false
    )
    private LocalDateTime horarioSolicitacao;


    @Column(
            name = "horario_decisao"
    )
    private LocalDateTime horarioDecisao;


    // =====================================================
    // PROFESSOR QUE TOMOU A DECISÃO
    // =====================================================

    /*
     * Usamos Usuario porque queremos registrar
     * exatamente qual usuário confirmou/recusou.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "professor_usuario_id"
    )
    private Usuario professorUsuario;


    // =====================================================
    // MOTIVO DE RECUSA
    // =====================================================

    /*
     * Deixamos pronto para futuramente o professor
     * poder informar um motivo.
     */
    @Column(
            name = "motivo_recusa",
            length = 500
    )
    private String motivoRecusa;


    // =====================================================
    // CONSTRUTOR
    // =====================================================

    public SolicitacaoPresencaBiometrica() {
    }


    // =====================================================
    // GETTERS / SETTERS
    // =====================================================

    public Integer getId() {
        return id;
    }


    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(
            Aluno aluno
    ) {
        this.aluno = aluno;
    }


    public Aula getAula() {
        return aula;
    }

    public void setAula(
            Aula aula
    ) {
        this.aula = aula;
    }


    public StatusSolicitacaoBiometrica getStatus() {
        return status;
    }

    public void setStatus(
            StatusSolicitacaoBiometrica status
    ) {
        this.status = status;
    }


    public StatusPresenca getStatusSugerido() {
        return statusSugerido;
    }

    public void setStatusSugerido(
            StatusPresenca statusSugerido
    ) {
        this.statusSugerido = statusSugerido;
    }


    public LocalDateTime getHorarioSolicitacao() {
        return horarioSolicitacao;
    }

    public void setHorarioSolicitacao(
            LocalDateTime horarioSolicitacao
    ) {
        this.horarioSolicitacao = horarioSolicitacao;
    }


    public LocalDateTime getHorarioDecisao() {
        return horarioDecisao;
    }

    public void setHorarioDecisao(
            LocalDateTime horarioDecisao
    ) {
        this.horarioDecisao = horarioDecisao;
    }


    public Usuario getProfessorUsuario() {
        return professorUsuario;
    }

    public void setProfessorUsuario(
            Usuario professorUsuario
    ) {
        this.professorUsuario = professorUsuario;
    }


    public String getMotivoRecusa() {
        return motivoRecusa;
    }

    public void setMotivoRecusa(
            String motivoRecusa
    ) {
        this.motivoRecusa = motivoRecusa;
    }


    // =====================================================
    // PRE PERSIST
    // =====================================================

    @PrePersist
    private void prepararAntesDeSalvar() {

        if (status == null) {
            status =
                    StatusSolicitacaoBiometrica.PENDENTE;
        }

        if (horarioSolicitacao == null) {
            horarioSolicitacao =
                    LocalDateTime.now();
        }
    }
}