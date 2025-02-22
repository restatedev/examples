package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStep;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.springboot.RestateService;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestateService
public class PuppeteerService {

    @Handler
    public String run(Context ctx, WorkflowStep wf) throws Exception {
        System.out.println("Taking screenshot of website with parameters: " + wf);
        String screenshotUrl = (String) wf.parameters().get("url");

        ctx.run(() -> takeWebsiteScreenshot(wf.imgOutputPath(), screenshotUrl));

        return "[Took screenshot of website with url: " + screenshotUrl + "]";
    }

    private void takeWebsiteScreenshot(String imgOutputPath, String screenshotUrl) throws IOException {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        WebDriver driver = new ChromeDriver(options);

        driver.manage().window().setSize(new org.openqa.selenium.Dimension(1388, 800));
        driver.get(screenshotUrl);

        File screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
        Files.copy(screenshot.toPath(), Paths.get(imgOutputPath));

        driver.quit();
    }
}