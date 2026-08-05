# Stage 1: Build the JAR
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
# Copy only necessary files first to leverage caching
COPY pom.xml .
COPY src ./src
# Build
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
# Copy the built jar from the previous stage
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
