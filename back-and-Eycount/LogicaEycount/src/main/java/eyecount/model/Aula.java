package eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
/*
 * Entidade Aula. Entidade que representa dados persistidos no banco e seus relacionamentos.
 */

@Entity
@Table(name = "aulas")
public class Aula {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Vinculo entre turma, disciplina e professor.

    @ManyToOne
    @JoinColumn(name = "turma_disciplina_id", nullable = false)
    private TurmaDisciplina turmaDisciplina;
    // Horario programado que pode ter originado a aula.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horario_aula_id")
    private HorarioAula horarioAula;
    // Data em que a aula acontece.

    @Column(name = "data_aula", nullable = false)
    private LocalDate dataAula;
    // Horario de inicio.

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;
    // Horario de termino.

    @Column(name = "hora_fim", nullable = true)
    private LocalTime horaFim;
    // Token usado no fluxo da aula ou autenticacao.

    @Column(length = 50)
    private String token;
    // Data e hora em que o token deixa de ser valido.

    @Column(name = "token_expiracao")
    private LocalDateTime tokenExpiracao;
    // Status atual do registro.

    @Enumerated(EnumType.STRING)
    private StatusAula status;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Aula() {}

    /*
     * Retorna o valor armazenado no campo HorarioAula.
     */
    public HorarioAula getHorarioAula() {
        return horarioAula;
    }

    /*
     * Atualiza o valor armazenado no campo HorarioAula.
     */
    public void setHorarioAula(HorarioAula horarioAula) {
        this.horarioAula = horarioAula;
    }

    /*
     * Retorna o valor armazenado no campo Id.
     */
    public Integer getId() {
        return id;
    }

    /*
     * Retorna o valor armazenado no campo TurmaDisciplina.
     */
    public TurmaDisciplina getTurmaDisciplina() {
        return turmaDisciplina;
    }

    /*
     * Atualiza o valor armazenado no campo TurmaDisciplina.
     */
    public void setTurmaDisciplina(TurmaDisciplina turmaDisciplina) {
        this.turmaDisciplina = turmaDisciplina;
    }

    /*
     * Retorna o valor armazenado no campo DataAula.
     */
    public LocalDate getDataAula() {
        return dataAula;
    }

    /*
     * Atualiza o valor armazenado no campo DataAula.
     */
    public void setDataAula(LocalDate dataAula) {
        this.dataAula = dataAula;
    }

    /*
     * Retorna o valor armazenado no campo HoraInicio.
     */
    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    /*
     * Atualiza o valor armazenado no campo HoraInicio.
     */
    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    /*
     * Retorna o valor armazenado no campo HoraFim.
     */
    public LocalTime getHoraFim() {
        return horaFim;
    }

    /*
     * Atualiza o valor armazenado no campo HoraFim.
     */
    public void setHoraFim(LocalTime horaFim) {
        this.horaFim = horaFim;
    }

    /*
     * Retorna o valor armazenado no campo Token.
     */
    public String getToken() {
        return token;
    }

    /*
     * Atualiza o valor armazenado no campo Token.
     */
    public void setToken(String token) {
        this.token = token;
    }

    /*
     * Retorna o valor armazenado no campo TokenExpiracao.
     */
    public LocalDateTime getTokenExpiracao() {
        return tokenExpiracao;
    }

    /*
     * Atualiza o valor armazenado no campo TokenExpiracao.
     */
    public void setTokenExpiracao(LocalDateTime tokenExpiracao) {
        this.tokenExpiracao = tokenExpiracao;
    }

    /*
     * Retorna o valor armazenado no campo Status.
     */
    public StatusAula getStatus() {
        return status;
    }

    /*
     * Atualiza o valor armazenado no campo Status.
     */
    public void setStatus(StatusAula status) {
        this.status = status;
    }
}
