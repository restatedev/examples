package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStep;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.springboot.RestateService;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.BufferedImageOp;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;

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

  private BufferedImage getImage(String inputPath) throws IOException {
    try {
      return ImageIO.read(new File(inputPath));
    } catch (IOException e) {
      throw new TerminalException("Error reading image: " + e.getMessage());
    }
  }

  private void writeImage(BufferedImage image, String outputPath) throws IOException {
    try {
      ImageIO.write(image, "png", new File(outputPath));
    } catch (IOException e) {
      throw new TerminalException("Error writing image: " + e.getMessage());
    }
  }

  private BufferedImage rotateImage(BufferedImage image, int angle) {
    double sin = Math.abs(Math.sin(angle)), cos = Math.abs(Math.cos(angle));
    int w = image.getWidth(), h = image.getHeight();
    int neww = (int) Math.floor(w * cos + h * sin), newh = (int) Math.floor(h * cos + w * sin);
    BufferedImage result = new BufferedImage(neww, newh, Transparency.TRANSLUCENT);
    Graphics2D g = result.createGraphics();
    g.translate((neww - w) / 2, (newh - h) / 2);
    g.rotate(angle, w / 2, h / 2);
    g.drawRenderedImage(image, null);
    g.dispose();
    return result;
  }

  private BufferedImage blurImage(BufferedImage image, int blur) {
    float[] matrix = new float[blur * blur];
    for (int i = 0; i < matrix.length; i++) {
      matrix[i] = 1.0f / (blur * blur);
    }
    BufferedImageOp op = new ConvolveOp(new Kernel(blur, blur, matrix), ConvolveOp.EDGE_NO_OP, null);
    return op.filter(image, null);
  }
}