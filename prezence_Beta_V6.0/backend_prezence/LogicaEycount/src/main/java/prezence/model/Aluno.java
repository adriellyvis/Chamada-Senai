package prezence.model;

import jakarta.persistence.*;

import java.time.LocalDate;


@Entity
@Table(
        name = "alunos",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_aluno_ra_completo",
                        columnNames = {
                                "matricula",
                                "digito_ra",
                                "uf"
                        }
                )
        }
)
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @OneToOne
    @JoinColumn(
            name = "usuario_id",
            nullable = false,
            unique = true
    )
    private Usuario usuario;


    @ManyToOne
    @JoinColumn(
            name = "turma_id",
            nullable = false
    )
    private Turma turma;


    /*
     * Número principal do RA.
     *
     * Exemplo:
     * 2026001
     */
    @Column(
            nullable = false,
            length = 50
    )
    private String matricula;


    /*
     * Dígito complementar do RA.
     *
     * Mantido como String para preservar:
     * 01, 02, 03...
     */
    @Column(
            name = "digito_ra",
            length = 2
    )
    private String digitoRa;


    /*
     * Unidade federativa associada ao RA.
     *
     * Exemplo:
     * SP, MT, MG...
     */
    @Column(
            name = "uf",
            length = 2
    )
    private String uf;


    @Column(
            name = "data_nascimento"
    )
    private LocalDate dataNascimento;


    public Aluno() {
    }


    public Integer getId() {
        return id;
    }


    public void setId(
            Integer id
    ) {
        this.id = id;
    }


    public Usuario getUsuario() {
        return usuario;
    }


    public void setUsuario(
            Usuario usuario
    ) {
        this.usuario = usuario;
    }


    public Turma getTurma() {
        return turma;
    }


    public void setTurma(
            Turma turma
    ) {
        this.turma = turma;
    }


    public String getMatricula() {
        return matricula;
    }


    public void setMatricula(
            String matricula
    ) {
        this.matricula = matricula;
    }


    public String getDigitoRa() {
        return digitoRa;
    }


    public void setDigitoRa(
            String digitoRa
    ) {
        this.digitoRa = digitoRa;
    }


    public String getUf() {
        return uf;
    }


    public void setUf(
            String uf
    ) {
        this.uf = uf;
    }


    public LocalDate getDataNascimento() {
        return dataNascimento;
    }


    public void setDataNascimento(
            LocalDate dataNascimento
    ) {
        this.dataNascimento = dataNascimento;
    }
}