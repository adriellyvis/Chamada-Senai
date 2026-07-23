package eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * Entidade Turma. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "turmas")
public class Turma {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Nome usado para identificar o registro.

    @Column(nullable = false, length = 100)
    private String nome;
    // Descricao detalhada do registro.

    @Column(columnDefinition = "TEXT")
    private String descricao;
    // Sala associada a turma.

    @Column(length = 50)
    private String sala;

    // Horario geral de inicio.
    private LocalTime horarioInicio;

    // Horario geral de termino.
    private LocalTime horarioFim;

    // Indica se o registro esta ativo no sistema.
    private Boolean ativo = true;
    // Data inicial do periodo.

    @Column(name = "data_inicio")
    private LocalDate dataInicio;
    // Data prevista para o encerramento.

    @Column(name = "data_fim_prevista")
    private LocalDate dataFimPrevista;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Turma() {}

    /*
     * Retorna o valor armazenado no campo Id.
     */
    public Integer getId() {
        return id;
    }

    /*
     * Atualiza o valor armazenado no campo Id.
     */
    public void setId(Integer id) {
        this.id = id;
    }

    /*
     * Retorna o valor armazenado no campo Nome.
     */
    public String getNome() {
        return nome;
    }

    /*
     * Atualiza o valor armazenado no campo Nome.
     */
    public void setNome(String nome) {
        this.nome = nome;
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
     * Retorna o valor armazenado no campo Sala.
     */
    public String getSala() {
        return sala;
    }

    /*
     * Atualiza o valor armazenado no campo Sala.
     */
    public void setSala(String sala) {
        this.sala = sala;
    }

    /*
     * Retorna o valor armazenado no campo HorarioInicio.
     */
    public LocalTime getHorarioInicio() {
        return horarioInicio;
    }

    /*
     * Atualiza o valor armazenado no campo HorarioInicio.
     */
    public void setHorarioInicio(LocalTime horarioInicio) {
        this.horarioInicio = horarioInicio;
    }

    /*
     * Retorna o valor armazenado no campo HorarioFim.
     */
    public LocalTime getHorarioFim() {
        return horarioFim;
    }

    /*
     * Atualiza o valor armazenado no campo HorarioFim.
     */
    public void setHorarioFim(LocalTime horarioFim) {
        this.horarioFim = horarioFim;
    }

    /*
     * Retorna o valor armazenado no campo Ativo.
     */
    public Boolean getAtivo() {
        return ativo;
    }

    /*
     * Atualiza o valor armazenado no campo Ativo.
     */
    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    /*
     * Retorna o valor armazenado no campo DataInicio.
     */
    public LocalDate getDataInicio() {
        return dataInicio;
    }

    /*
     * Atualiza o valor armazenado no campo DataInicio.
     */
    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }

    /*
     * Retorna o valor armazenado no campo DataFimPrevista.
     */
    public LocalDate getDataFimPrevista() {
        return dataFimPrevista;
    }

    /*
     * Atualiza o valor armazenado no campo DataFimPrevista.
     */
    public void setDataFimPrevista(LocalDate dataFimPrevista) {
        this.dataFimPrevista = dataFimPrevista;
    }

}
