package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStep;
import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.springboot.RestateComponent;

import java.awt.image.BufferedImage;

import static com.example.restatestarter.utils.TransformerUtils.*;

@RestateComponent
@Service
public class TransformerService {

  @Handler
  public String rotate(WorkflowStep wfStep) throws Exception {
    int angle = (int) wfStep.parameters().get("angle");
    System.out.println("Rotating image with angle: " + angle);

    Restate.run("rotate", () -> {
      BufferedImage image = getImage(wfStep.imgInputPath());
      BufferedImage rotatedImage = rotateImage(image, angle);
      writeImage(rotatedImage, wfStep.imgOutputPath());
    });

    return "[Rotated image with angle: " + angle + "]";
  }

  @Handler
  public String blur(WorkflowStep wfStep) throws Exception {
    int blur = (int) wfStep.parameters().get("blur");
    System.out.println("Blurring image with parameter " + blur);

    Restate.run("blur", () -> {
      BufferedImage image = getImage(wfStep.imgInputPath());
      BufferedImage blurredImage = blurImage(image, blur);
      writeImage(blurredImage, wfStep.imgOutputPath());
    });

    return "[Blurred image with strength param " + blur + "]";
  }
}
