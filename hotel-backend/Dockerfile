FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY pom.xml .
COPY src ./src

RUN mvn -q -DskipTests package

FROM openliberty/open-liberty:24.0.0.12-kernel-slim-java17-openj9-ubi

COPY --chown=1001:0 src/main/liberty/config/server.xml /config/server.xml
COPY --chown=1001:0 src/main/liberty/config/lib/postgresql-42.7.3.jar /config/lib/postgresql-42.7.3.jar

RUN features.sh

COPY --from=build --chown=1001:0 /workspace/target/hotel.war /config/dropins/hotel.war

EXPOSE 9080 9443
