package com.airline.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Before("execution(* com.airline.service.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        log.info("Entering service method: {} with arguments: {}",
                joinPoint.getSignature().toShortString(),
                Arrays.toString(joinPoint.getArgs()));
    }

    @AfterReturning(pointcut = "execution(* com.airline.service.*.*(..))", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        log.info("Service method: {} returned: {}",
                joinPoint.getSignature().toShortString(),
                result != null ? result.getClass().getSimpleName() : "void");
    }

    @AfterThrowing(pointcut = "execution(* com.airline.service.*.*(..))", throwing = "error")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable error) {
        log.error("Exception in service method: {} with message: {}",
                joinPoint.getSignature().toShortString(),
                error.getMessage(), error);
    }
}
