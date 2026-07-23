package eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
/*
 * Entidade Presenca. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "presencas")
public class Presenca {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Aluno relacionado a este registro.

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;
    // Campo aula usado por esta classe.

    @ManyToOne
    @JoinColumn(name = "aula_id", nullable = false)
    private Aula aula;
    // Status atual do registro.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPresenca status;
    // Data e hora em que a presenca foi registrada.

    @Column(name = "horario_registro")
    private LocalDateTime horarioRegistro;
    // Metodo usado para realizar o registro.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetodoPresenca metodo;
    // Indica se o registro foi validado por biometria.

    @Column(name = "validacao_biometrica")
    private Boolean validacaoBiometrica = false;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Presenca() {}

    /*
     * Retorna o valor armazenado no campo Id.
     */
    public Integer getId() {
        return id;
    }

    /*
     * Retorna o valor armazenado no campo Aluno.
     */
    public Aluno getAluno() {
        return aluno;
    }

    /*
     * Atualiza o valor armazenado no campo Aluno.
     */
    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    /*
     * Retorna o valor armazenado no campo Aula.
     */
    public Aula getAula() {
        return aula;
    }

    /*
     * Atualiza o valor armazenado no campo Aula.
     */
    public void setAula(Aula aula) {
        this.aula = aula;
    }

    /*
     * Retorna o valor armazenado no campo Status.
     */
    public StatusPresenca getStatus() {
        return status;
    }

    /*
     * Atualiza o valor armazenado no campo Status.
     */
    public void setStatus(StatusPresenca status) {
        this.status = status;
    }

    /*
     * Retorna o valor armazenado no campo HorarioRegistro.
     */
    public LocalDateTime getHorarioRegistro() {
        return horarioRegistro;
    }

    /*
     * Atualiza o valor armazenado no campo HorarioRegistro.
     */
    public void setHorarioRegistro(LocalDateTime horarioRegistro) {
        this.horarioRegistro = horarioRegistro;
    }

    /*
     * Retorna o valor armazenado no campo Metodo.
     */
    public MetodoPresenca getMetodo() {
        return metodo;
    }

    /*
     * Atualiza o valor armazenado no campo Metodo.
     */
    public void setMetodo(MetodoPresenca metodo) {
        this.metodo = metodo;
    }

    /*
     * Retorna o valor armazenado no campo ValidacaoBiometrica.
     */
    public Boolean getValidacaoBiometrica() {
        return validacaoBiometrica;
    }

    /*
     * Atualiza o valor armazenado no campo ValidacaoBiometrica.
     */
    public void setValidacaoBiometrica(Boolean validacaoBiometrica) {
        this.validacaoBiometrica = validacaoBiometrica;
    }

}
