package com.eyecount.dto.ocorrencia;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaMetricasDTO {
    private Long total;
    private Long pendentes;
    private Long resolvidas;
    private Long graves;
    private Long medias;
    private Long leves;

}