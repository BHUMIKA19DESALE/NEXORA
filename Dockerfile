# Use official Python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy dependency definition
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files into container
COPY . .

# Expose port
EXPOSE 5000

# Run the app entry point
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "5000"]