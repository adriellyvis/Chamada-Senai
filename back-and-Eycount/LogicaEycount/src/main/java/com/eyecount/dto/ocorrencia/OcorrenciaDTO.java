package com.eyecount.dto.ocorrencia;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaDTO {
    private Integer id;
    private Integer alunoId;
    private String alunoNome;
    private Integer professorId;
    private String professorNome;
    private String titulo;
    private String descricao;
    private String tipo;
    private String gravidade;
    private String status;
    private LocalDateTime dataOcorrencia;
    private String respostaGestor;
    private LocalDateTime dataAtualizacao;

}