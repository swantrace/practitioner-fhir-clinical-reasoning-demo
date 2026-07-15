FROM hapiproject/hapi:v8.10.0-2

COPY application.yaml /app/config/application-fly.yaml

# Add our settings on top of the defaults bundled with the official image.
ENV SPRING_CONFIG_ADDITIONAL_LOCATION=file:/app/config/application-fly.yaml

EXPOSE 8080
