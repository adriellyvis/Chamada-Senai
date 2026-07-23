package eyecount.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "horarios_aula",
        indexes = {
                @Index(
                        name = "idx_horario_dia_ativo",
                        columnList = "dia_semana, ativo"
                ),
                @Index(
                        name = "idx_horario_turma_disciplina",
                        columnList = "turma_disciplina_id"
                )
        }
)
/*
 * Entidade HorarioAula. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */
@Getter
@Setter
@NoArgsConstructor
public class HorarioAula {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "turma_disciplina_id",
            nullable = false
    )
    // Vinculo entre turma, disciplina e professor.
    private TurmaDisciplina turmaDisciplina;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "dia_semana",
            nullable = false,
            length = 20
    )
    // Dia da semana em que a aula acontece.
    private DayOfWeek diaSemana;

    @Column(
            name = "hora_inicio",
            nullable = false
    )
    // Horario de inicio.
    private LocalTime horaInicio;

    @Column(
            name = "hora_fim",
            nullable = false
    )
    // Horario de termino.
    private LocalTime horaFim;

    @Column(
            name = "tolerancia_minutos",
            nullable = false
    )
    // Quantidade de minutos de tolerancia para a presenca.
    private Integer toleranciaMinutos = 30;

    @Column(
            name = "abertura_automatica",
            nullable = false
    )
    // Indica se a chamada deve abrir automaticamente.
    private Boolean aberturaAutomatica = true;

    @Column(
            name = "encerramento_automatico",
            nullable = false
    )
    // Indica se a chamada deve encerrar automaticamente.
    private Boolean encerramentoAutomatico = true;
    // Data em que o horario comeca a valer.

    @Column(name = "data_inicio_vigencia")
    private LocalDate dataInicioVigencia;
    // Data em que o horario deixa de valer.

    @Column(name = "data_fim_vigencia")
    private LocalDate dataFimVigencia;

    @Column(
            name = "ativo",
            nullable = false
    )
    // Indica se o registro esta ativo no sistema.
    private Boolean ativo = true;
}
