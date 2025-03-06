package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStep;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.springboot.RestateService;

import java.awt.image.BufferedImage;

import static com.example.restatestarter.utils.TransformerUtils.*;

@RestateService
public class TransformerService {

  @Handler
  public String rotate(Context ctx, WorkflowStep wfStep) throws Exception {
    int angle = (int) wfStep.parameters().get("angle");
    System.out.println("Rotating image with angle: " + angle);

    ctx.run(() -> {
      BufferedImage image = getImage(wfStep.imgInputPath());
      BufferedImage rotatedImage = rotateImage(image, angle);
      writeImage(rotatedImage, wfStep.imgOutputPath());
    });

    return "[Rotated image with angle: " + angle + "]";
  }

  @Handler
  public String blur(Context ctx, WorkflowStep wfStep) throws Exception {
    int blur = (int) wfStep.parameters().get("blur");
    System.out.println("Blurring image with parameter " + blur);

    ctx.run(() -> {
      BufferedImage image = getImage(wfStep.imgInputPath());
      BufferedImage blurredImage = blurImage(image, blur);
      writeImage(blurredImage, wfStep.imgOutputPath());
    });

    return "[Blurred image with strength param " + blur + "]";
  }
}