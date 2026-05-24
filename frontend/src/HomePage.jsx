import { Container, Row, Col, Card, Button } from "react-bootstrap";

function HomePage() {
  return (
    <div className="homepage">
      <Container className="py-5">
        <Row className="justify-content-center text-center mb-5">
          <Col md={10} lg={8}>
            <h1 className="main-title">CSBM Data Analytics</h1>
            <p className="main-subtitle">
              Smart analytics platform for the Registration Department to upload
              Excel and CSV files, analyze data, and generate charts for better
              decision-making.
            </p>

            <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
              <Button variant="primary" size="lg">
                Admin Login
              </Button>
              <Button variant="outline-light" size="lg">
                User Login
              </Button>
              <Button variant="success" size="lg">
                Register
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Card className="feature-card h-100">
              <Card.Body>
                <Card.Title>Upload Excel / CSV</Card.Title>
                <Card.Text>
                  Upload and manage structured datasets for analytics.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="feature-card h-100">
              <Card.Body>
                <Card.Title>Analyze Smartly</Card.Title>
                <Card.Text>
                  Filter data by Type, Program, and Batch for insights.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="feature-card h-100">
              <Card.Body>
                <Card.Title>Visualize Charts</Card.Title>
                <Card.Text>
                  Generate charts for better decision-making.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default HomePage;