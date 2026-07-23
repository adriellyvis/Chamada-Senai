package eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
/*
 * Entidade Ocorrencia. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "ocorrencias")
public class Ocorrencia {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Aluno relacionado a este registro.

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;
    // Professor relacionado a este registro.

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private Professor professor;
    // Titulo resumido do registro.

    @Column(nullable = false, length = 150)
    private String titulo;
    // Descricao detalhada do registro.

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;
    // Nivel de gravidade da ocorrencia.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GravidadeOcorrencia gravidade;
    // Status atual do registro.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOcorrencia status;
    // Tipo usado para classificar o registro.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoOcorrencia tipo;

    // Data e hora em que a ocorrencia foi registrada.
    private LocalDateTime dataOcorrencia;
    // Resposta ou justificativa informada pelo gestor.

    @Column(name = "resposta_gestor", columnDefinition = "TEXT")
    private String respostaGestor;

    // Data e hora da ultima atualizacao.
    private LocalDateTime dataAtualizacao;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Ocorrencia() {

        this.dataOcorrencia =
                LocalDateTime.now();

        this.status =
                StatusOcorrencia.PENDENTE;
    }

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
     * Retorna o valor armazenado no campo Professor.
     */
    public Professor getProfessor() {
        return professor;
    }

    /*
     * Atualiza o valor armazenado no campo Professor.
     */
    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

    /*
     * Retorna o valor armazenado no campo Titulo.
     */
    public String getTitulo() {
        return titulo;
    }

    /*
     * Atualiza o valor armazenado no campo Titulo.
     */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /*
     * Retorna o valor armazenado no campo Descricao.
     */
    public String getDescricao() {
        return descricao;
    }

    /*
     * Atualiza o valor armazenado no campo Descricao.
     */
    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    /*
     * Retorna o valor armazenado no campo Gravidade.
     */
    public GravidadeOcorrencia getGravidade() {
        return gravidade;
    }

    /*
     * Atualiza o valor armazenado no campo Gravidade.
     */
    public void setGravidade(
            GravidadeOcorrencia gravidade
    ) {
        this.gravidade = gravidade;
    }

    /*
     * Retorna o valor armazenado no campo Status.
     */
    public StatusOcorrencia getStatus() {
        return status;
    }

    /*
     * Atualiza o valor armazenado no campo Status.
     */
    public void setStatus(
            StatusOcorrencia status
    ) {
        this.status = status;
    }

    /*
     * Retorna o valor armazenado no campo Tipo.
     */
    public TipoOcorrencia getTipo() {
        return tipo;
    }

    /*
     * Atualiza o valor armazenado no campo Tipo.
     */
    public void setTipo(
            TipoOcorrencia tipo
    ) {
        this.tipo = tipo;
    }

    /*
     * Retorna o valor armazenado no campo DataOcorrencia.
     */
    public LocalDateTime getDataOcorrencia() {
        return dataOcorrencia;
    }

    /*
     * Retorna o valor armazenado no campo RespostaGestor.
     */
    public String getRespostaGestor() {
        return respostaGestor;
    }

    /*
     * Atualiza o valor armazenado no campo RespostaGestor.
     */
    public void setRespostaGestor(String respostaGestor) {
        this.respostaGestor = respostaGestor;
    }

    /*
     * Retorna o valor armazenado no campo DataAtualizacao.
     */
    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    /*
     * Atualiza o valor armazenado no campo DataAtualizacao.
     */
    public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }

}
