# Stage 1: Build the JAR
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Copy only the pom.xml first to cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the source code
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the built jar from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Explicitly expose port
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
