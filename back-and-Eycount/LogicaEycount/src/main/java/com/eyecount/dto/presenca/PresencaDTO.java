package com.eyecount.dto.presenca;

import com.eyecount.model.MetodoPresenca;
import com.eyecount.model.StatusPresenca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresencaDTO {

    private Integer alunoId;
    private Integer aulaId;
    private StatusPresenca status;
    private MetodoPresenca metodo;

}