package prezence.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "avisos",
        indexes = {
                @Index(
                        name = "idx_aviso_aluno",
                        columnList = "aluno_id"
                ),
                @Index(
                        name = "idx_aviso_data",
                        columnList = "data_criacao"
                )
        }
)
public class Aviso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /*
     * Aluno que receberá o aviso.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "aluno_id",
            nullable = false
    )
    private Aluno aluno;

    /*
     * Usuário que enviou o aviso.
     *
     * Pode ser:
     * - gestor;
     * - professor.
     *
     * Usamos Usuario porque os dois perfis já possuem
     * um usuário no sistema.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "autor_id",
            nullable = false
    )
    private Usuario autor;

    /*
     * Turma relacionada ao aviso.
     *
     * É opcional porque um aviso do gestor pode não
     * estar relacionado a uma turma específica.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @Column(
            nullable = false,
            length = 150
    )
    private String titulo;

    @Column(
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private CategoriaAviso categoria;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private PrioridadeAviso prioridade;

    /*
     * Indica se o aluno já visualizou o aviso.
     */
    @Column(nullable = false)
    private Boolean lido = false;

    /*
     * Campos abaixo são usados principalmente
     * nos feedbacks enviados pelo professor.
     */

    private Double frequencia;

    private Double nota;

    @Column(columnDefinition = "TEXT")
    private String melhorias;

    @Column(
            name = "data_criacao",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataCriacao = LocalDateTime.now();


    public Aviso() {
    }


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }


    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }


    public Usuario getAutor() {
        return autor;
    }

    public void setAutor(Usuario autor) {
        this.autor = autor;
    }


    public Turma getTurma() {
        return turma;
    }

    public void setTurma(Turma turma) {
        this.turma = turma;
    }


    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }


    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }


    public CategoriaAviso getCategoria() {
        return categoria;
    }

    public void setCategoria(
            CategoriaAviso categoria
    ) {
        this.categoria = categoria;
    }


    public PrioridadeAviso getPrioridade() {
        return prioridade;
    }

    public void setPrioridade(
            PrioridadeAviso prioridade
    ) {
        this.prioridade = prioridade;
    }


    public Boolean getLido() {
        return lido;
    }

    public void setLido(Boolean lido) {
        this.lido = lido;
    }


    public Double getFrequencia() {
        return frequencia;
    }

    public void setFrequencia(
            Double frequencia
    ) {
        this.frequencia = frequencia;
    }


    public Double getNota() {
        return nota;
    }

    public void setNota(Double nota) {
        this.nota = nota;
    }


    public String getMelhorias() {
        return melhorias;
    }

    public void setMelhorias(
            String melhorias
    ) {
        this.melhorias = melhorias;
    }


    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(
            LocalDateTime dataCriacao
    ) {
        this.dataCriacao = dataCriacao;
    }


    @PrePersist
    private void prepararAntesDeSalvar() {

        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }

        if (lido == null) {
            lido = false;
        }

        if (prioridade == null) {
            prioridade = PrioridadeAviso.NORMAL;
        }

        if (categoria == null) {
            categoria = CategoriaAviso.GERAL;
        }
    }

}