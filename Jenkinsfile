pipeline {
    agent any

    tools {
        maven 'Maven-3.8'
        jdk 'JDK-21'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout step handles code retrieval
                checkout scm
            }
        }

        stage('Compile') {
            steps {
                sh 'mvn -f backend/pom.xml clean compile'
            }
        }

        stage('Test') {
            steps {
                sh 'mvn -f backend/pom.xml test'
            }
            post {
                always {
                    junit 'backend/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Package') {
            steps {
                sh 'mvn -f backend/pom.xml package -DskipTests'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    sh 'docker-compose build'
                }
            }
        }

        stage('Deploy to Local') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline Completed Successfully."
        }
        failure {
            echo "CI/CD Pipeline Failed. Please check console outputs."
        }
    }
}
